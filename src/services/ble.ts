// FTMS (Fitness Machine Service) UUIDs
const FTMS_SERVICE_UUID = '00001826-0000-1000-8000-00805f9b34fb';
const INDOOR_BIKE_DATA_UUID = '00002ad2-0000-1000-8000-00805f9b34fb';
const FTMS_CONTROL_POINT_UUID = '00002ad9-0000-1000-8000-00805f9b34fb';

// Cycling Power Service UUIDs (for future use)
const CYCLING_POWER_SERVICE_UUID = '00001818-0000-1000-8000-00805f9b34fb';

// Heart Rate Service UUIDs
const HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT_UUID = '00002a37-0000-1000-8000-00805f9b34fb';

// FTMS Control Point OpCodes
const FTMS_REQUEST_CONTROL = 0x00;
const FTMS_SET_TARGET_POWER = 0x05;

export interface TrainerData {
  timestamp: number;
  power: number;        // Watts
  cadence: number;      // RPM
  speed: number;        // km/h
  heartRate?: number;   // BPM (if available)
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type DataCallback = (data: TrainerData) => void;
export type StatusCallback = (status: ConnectionStatus, message?: string) => void;

/**
 * BLEService - Manages Bluetooth Low Energy connections to smart trainers
 *
 * Supports FTMS (Fitness Machine Service) protocol for controlling smart trainers
 * like Wahoo Kickr. Handles connection, data streaming, and power control.
 */
class BLEService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private ftmsService: BluetoothRemoteGATTService | null = null;
  private controlPoint: BluetoothRemoteGATTCharacteristic | null = null;
  private bikeDataChar: BluetoothRemoteGATTCharacteristic | null = null;

  private dataCallbacks: Set<DataCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();

  private hasControl = false;

  /**
   * Register a callback to receive trainer data updates
   * @param callback - Function called with new trainer data (power, cadence, speed)
   * @returns Cleanup function to remove the callback
   */
  onData(callback: DataCallback): () => void {
    this.dataCallbacks.add(callback);
    return () => this.dataCallbacks.delete(callback);
  }

  /**
   * Register a callback to receive connection status updates
   * @param callback - Function called when connection status changes
   * @returns Cleanup function to remove the callback
   */
  onStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private notifyData(data: TrainerData) {
    this.dataCallbacks.forEach(cb => cb(data));
  }

  private notifyStatus(status: ConnectionStatus, message?: string) {
    this.statusCallbacks.forEach(cb => cb(status, message));
  }

  /**
   * Connect to a Bluetooth smart trainer
   *
   * Opens the browser's Bluetooth device picker and connects to the selected
   * FTMS-compatible trainer. Automatically requests control and starts data streaming.
   *
   * @returns Promise<boolean> - true if connection successful, false otherwise
   */
  async connect(): Promise<boolean> {
    try {
      this.notifyStatus('connecting');

      // Request device with FTMS service
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [FTMS_SERVICE_UUID] },
          { namePrefix: 'KICKR' },
          { namePrefix: 'Wahoo' },
        ],
        optionalServices: [CYCLING_POWER_SERVICE_UUID],
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnect();
      });

      // Connect to GATT server
      if (!this.device.gatt) {
        throw new Error('Device does not support GATT');
      }
      this.server = await this.device.gatt.connect();

      // Get FTMS service
      this.ftmsService = await this.server.getPrimaryService(FTMS_SERVICE_UUID);

      // Get characteristics
      this.controlPoint = await this.ftmsService.getCharacteristic(FTMS_CONTROL_POINT_UUID);
      this.bikeDataChar = await this.ftmsService.getCharacteristic(INDOOR_BIKE_DATA_UUID);

      // Subscribe to bike data notifications
      await this.bikeDataChar.startNotifications();
      this.bikeDataChar.addEventListener('characteristicvaluechanged', this.handleBikeData.bind(this));

      // Request control of the trainer
      await this.requestControl();

      this.notifyStatus('connected', `Connected to ${this.device.name}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      this.notifyStatus('error', message);
      return false;
    }
  }

  private async requestControl(): Promise<boolean> {
    if (!this.controlPoint) return false;

    try {
      // Subscribe to control point indications
      await this.controlPoint.startNotifications();

      // Request control
      const requestControlCmd = new Uint8Array([FTMS_REQUEST_CONTROL]);
      await this.controlPoint.writeValue(requestControlCmd);

      this.hasControl = true;
      return true;
    } catch (error) {
      // Silently handle error - control request failed
      return false;
    }
  }

  /**
   * Set the target power for ERG mode
   *
   * Controls the trainer's resistance to maintain the specified power output.
   * Requires an active connection and trainer control.
   *
   * @param watts - Target power in watts (typically 0-1000W for most trainers)
   * @returns Promise<boolean> - true if command sent successfully, false otherwise
   */
  async setTargetPower(watts: number): Promise<boolean> {
    if (!this.controlPoint || !this.hasControl) {
      return false;
    }

    try {
      // FTMS Set Target Power command
      // OpCode (1 byte) + Target Power (2 bytes, little-endian, in watts)
      const buffer = new ArrayBuffer(3);
      const view = new DataView(buffer);
      view.setUint8(0, FTMS_SET_TARGET_POWER);
      view.setInt16(1, Math.round(watts), true); // Little-endian

      await this.controlPoint.writeValue(buffer);
      return true;
    } catch (error) {
      // Silently handle error - power setting failed
      return false;
    }
  }

  private handleBikeData(event: Event) {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value) return;

    // Parse FTMS Indoor Bike Data
    // Flags are in first 2 bytes
    const flags = value.getUint16(0, true);

    let offset = 2;
    let speed = 0;
    let cadence = 0;
    let power = 0;

    // Instantaneous Speed (always present if bit 0 is 0)
    // Speed is in 0.01 km/h resolution
    if (!(flags & 0x0001)) {
      speed = value.getUint16(offset, true) * 0.01;
      offset += 2;
    }

    // Average Speed (bit 1)
    if (flags & 0x0002) {
      offset += 2; // Skip average speed
    }

    // Instantaneous Cadence (bit 2)
    if (flags & 0x0004) {
      cadence = value.getUint16(offset, true) * 0.5; // 0.5 RPM resolution
      offset += 2;
    }

    // Average Cadence (bit 3)
    if (flags & 0x0008) {
      offset += 2;
    }

    // Total Distance (bit 4)
    if (flags & 0x0010) {
      offset += 3; // 3 bytes for distance
    }

    // Resistance Level (bit 5)
    if (flags & 0x0020) {
      offset += 2;
    }

    // Instantaneous Power (bit 6)
    if (flags & 0x0040) {
      power = value.getInt16(offset, true);
      offset += 2;
    }

    // Average Power (bit 7)
    if (flags & 0x0080) {
      offset += 2;
    }

    // Heart Rate (bit 9)
    let heartRate: number | undefined;
    if (flags & 0x0200) {
      // Need to skip expended energy first (bit 8)
      if (flags & 0x0100) {
        offset += 5; // Total + per hour + per minute
      }
      heartRate = value.getUint8(offset);
    }

    const data: TrainerData = {
      timestamp: Date.now(),
      power,
      cadence,
      speed,
      heartRate,
    };

    this.notifyData(data);
  }

  private handleDisconnect() {
    this.hasControl = false;
    this.controlPoint = null;
    this.bikeDataChar = null;
    this.ftmsService = null;
    this.server = null;
    this.notifyStatus('disconnected');
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  getDeviceName(): string | null {
    return this.device?.name ?? null;
  }
}

// Singleton instance
export const bleService = new BLEService();

// Heart Rate Monitor Service
export type HRCallback = (heartRate: number) => void;
export type HRStatusCallback = (status: ConnectionStatus, message?: string) => void;

class HRMonitorService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private hrChar: BluetoothRemoteGATTCharacteristic | null = null;

  private hrCallbacks: Set<HRCallback> = new Set();
  private statusCallbacks: Set<HRStatusCallback> = new Set();

  onHeartRate(callback: HRCallback): () => void {
    this.hrCallbacks.add(callback);
    return () => this.hrCallbacks.delete(callback);
  }

  onStatus(callback: HRStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private notifyHR(hr: number) {
    this.hrCallbacks.forEach(cb => cb(hr));
  }

  private notifyStatus(status: ConnectionStatus, message?: string) {
    this.statusCallbacks.forEach(cb => cb(status, message));
  }

  async connect(): Promise<boolean> {
    try {
      this.notifyStatus('connecting');

      // Request device with Heart Rate service
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE_UUID] }],
        optionalServices: [],
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnect();
      });

      // Connect to GATT server
      if (!this.device.gatt) {
        throw new Error('Device does not support GATT');
      }
      this.server = await this.device.gatt.connect();

      // Get Heart Rate service
      const hrService = await this.server.getPrimaryService(HEART_RATE_SERVICE_UUID);

      // Get Heart Rate Measurement characteristic
      this.hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT_UUID);

      // Subscribe to HR notifications
      await this.hrChar.startNotifications();
      this.hrChar.addEventListener('characteristicvaluechanged', this.handleHRData.bind(this));

      this.notifyStatus('connected', `HR: ${this.device.name}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'HR connection failed';
      this.notifyStatus('error', message);
      return false;
    }
  }

  private handleHRData(event: Event) {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value) return;

    // Parse Heart Rate Measurement
    // First byte is flags
    const flags = value.getUint8(0);
    let heartRate: number;

    // Bit 0: HR value format (0 = UINT8, 1 = UINT16)
    if (flags & 0x01) {
      heartRate = value.getUint16(1, true);
    } else {
      heartRate = value.getUint8(1);
    }

    this.notifyHR(heartRate);
  }

  private handleDisconnect() {
    this.hrChar = null;
    this.server = null;
    this.notifyStatus('disconnected');
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  getDeviceName(): string | null {
    return this.device?.name ?? null;
  }
}

export const hrMonitorService = new HRMonitorService();
