import type { RecordedWorkout } from './recorder';
import type { TrainerData } from './ble';

/**
 * Export workout data as JSON format
 *
 * Creates a human-readable JSON representation of the workout including
 * all data points and summary statistics.
 *
 * @param workout - Recorded workout data
 * @returns JSON string with formatted workout data
 */
export function exportToJSON(workout: RecordedWorkout): string {
  return JSON.stringify(workout, null, 2);
}

/**
 * Export workout data as FIT (Flexible and Interoperable Data Transfer) file
 *
 * Converts workout data to the FIT binary format used by Garmin, Strava,
 * Training Peaks, and other fitness platforms. Includes file header, activity
 * data, session summary, individual records, and lap information.
 *
 * @param workout - Recorded workout data
 * @returns ArrayBuffer containing binary FIT file data
 */
export function exportToFIT(workout: RecordedWorkout): ArrayBuffer {
  const encoder = new FITEncoder();

  // File ID message
  encoder.writeFileId(workout.summary.startTime);

  // Activity message
  encoder.writeActivity(workout.summary);

  // Session message
  encoder.writeSession(workout.summary);

  // Record messages (one per data point)
  for (const record of workout.data) {
    encoder.writeRecord(record);
  }

  // Lap message (single lap for now)
  encoder.writeLap(workout.summary);

  return encoder.finish();
}

/**
 * Trigger file download in the browser
 *
 * Creates a blob from the provided data and triggers a download with the
 * specified filename. Automatically cleans up the temporary object URL.
 *
 * @param data - File data as ArrayBuffer or string
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type (e.g., 'application/json', 'application/octet-stream')
 */
export function downloadFile(data: ArrayBuffer | string, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// FIT file encoder class
class FITEncoder {
  private buffer: number[] = [];
  private dataSize = 0;
  private localMessageTypes: Map<number, number> = new Map();
  private nextLocalType = 0;

  // FIT base types (only used ones to avoid TS warnings)
  private static UINT8 = 0;
  private static UINT16 = 132;
  private static UINT32 = 134;
  private static ENUM = 0;

  // Global message numbers
  private static MSG_FILE_ID = 0;
  private static MSG_ACTIVITY = 34;
  private static MSG_SESSION = 18;
  private static MSG_LAP = 19;
  private static MSG_RECORD = 20;

  constructor() {
    this.writeHeader();
  }

  private writeHeader() {
    // FIT file header (14 bytes)
    // Header size
    this.buffer.push(14);
    // Protocol version
    this.buffer.push(0x20);
    // Profile version (little-endian)
    this.buffer.push(0x08, 0x08);
    // Data size placeholder (will be filled later)
    this.buffer.push(0, 0, 0, 0);
    // ".FIT" signature
    this.buffer.push(0x2E, 0x46, 0x49, 0x54);
    // CRC placeholder (2 bytes)
    this.buffer.push(0, 0);
  }

  private writeDefinition(globalMsgNum: number, fields: Array<{ num: number; size: number; type: number }>) {
    const localType = this.nextLocalType++;
    this.localMessageTypes.set(globalMsgNum, localType);

    // Record header (definition)
    this.buffer.push(0x40 | localType);
    this.dataSize++;

    // Reserved
    this.buffer.push(0);
    this.dataSize++;

    // Architecture (0 = little-endian)
    this.buffer.push(0);
    this.dataSize++;

    // Global message number (little-endian)
    this.buffer.push(globalMsgNum & 0xFF, (globalMsgNum >> 8) & 0xFF);
    this.dataSize += 2;

    // Number of fields
    this.buffer.push(fields.length);
    this.dataSize++;

    // Field definitions
    for (const field of fields) {
      this.buffer.push(field.num, field.size, field.type);
      this.dataSize += 3;
    }
  }

  private writeData(globalMsgNum: number, values: number[]) {
    const localType = this.localMessageTypes.get(globalMsgNum);
    if (localType === undefined) {
      throw new Error(`No definition for message type ${globalMsgNum}`);
    }

    // Record header (data)
    this.buffer.push(localType);
    this.dataSize++;

    // Field values
    for (const value of values) {
      this.buffer.push(value);
      this.dataSize++;
    }
  }

  private toFITTimestamp(jsTimestamp: number): number {
    // FIT timestamp is seconds since UTC 00:00 Dec 31 1989
    const FIT_EPOCH = Date.UTC(1989, 11, 31, 0, 0, 0);
    return Math.floor((jsTimestamp - FIT_EPOCH) / 1000);
  }

  private uint32LE(value: number): number[] {
    return [
      value & 0xFF,
      (value >> 8) & 0xFF,
      (value >> 16) & 0xFF,
      (value >> 24) & 0xFF,
    ];
  }

  private uint16LE(value: number): number[] {
    return [value & 0xFF, (value >> 8) & 0xFF];
  }

  writeFileId(timestamp: number) {
    // Define file_id message
    this.writeDefinition(FITEncoder.MSG_FILE_ID, [
      { num: 0, size: 1, type: FITEncoder.ENUM },    // type
      { num: 1, size: 2, type: FITEncoder.UINT16 },  // manufacturer
      { num: 2, size: 2, type: FITEncoder.UINT16 },  // product
      { num: 3, size: 4, type: FITEncoder.UINT32 },  // serial_number
      { num: 4, size: 4, type: FITEncoder.UINT32 },  // time_created
    ]);

    // Write file_id data
    const fitTimestamp = this.toFITTimestamp(timestamp);
    this.writeData(FITEncoder.MSG_FILE_ID, [
      4, // type = activity
      ...this.uint16LE(1), // manufacturer = garmin (1) for compatibility
      ...this.uint16LE(1), // product
      ...this.uint32LE(12345), // serial number
      ...this.uint32LE(fitTimestamp),
    ]);
  }

  writeActivity(summary: { startTime: number; duration: number }) {
    this.writeDefinition(FITEncoder.MSG_ACTIVITY, [
      { num: 253, size: 4, type: FITEncoder.UINT32 }, // timestamp
      { num: 0, size: 4, type: FITEncoder.UINT32 },   // total_timer_time
      { num: 1, size: 2, type: FITEncoder.UINT16 },   // num_sessions
      { num: 2, size: 1, type: FITEncoder.ENUM },     // type
      { num: 3, size: 1, type: FITEncoder.ENUM },     // event
      { num: 4, size: 1, type: FITEncoder.ENUM },     // event_type
    ]);

    const fitTimestamp = this.toFITTimestamp(summary.startTime);
    this.writeData(FITEncoder.MSG_ACTIVITY, [
      ...this.uint32LE(fitTimestamp),
      ...this.uint32LE(summary.duration * 1000), // milliseconds
      ...this.uint16LE(1), // 1 session
      0, // type = manual
      26, // event = activity
      1, // event_type = stop
    ]);
  }

  writeSession(summary: { startTime: number; duration: number; avgPower: number; maxPower: number; avgCadence: number; avgSpeed: number; avgHeartRate: number; maxHeartRate: number; totalDistance: number }) {
    this.writeDefinition(FITEncoder.MSG_SESSION, [
      { num: 253, size: 4, type: FITEncoder.UINT32 }, // timestamp
      { num: 2, size: 4, type: FITEncoder.UINT32 },   // start_time
      { num: 7, size: 4, type: FITEncoder.UINT32 },   // total_elapsed_time
      { num: 8, size: 4, type: FITEncoder.UINT32 },   // total_timer_time
      { num: 9, size: 4, type: FITEncoder.UINT32 },   // total_distance (m * 100)
      { num: 5, size: 1, type: FITEncoder.ENUM },     // sport
      { num: 6, size: 1, type: FITEncoder.ENUM },     // sub_sport
      { num: 20, size: 2, type: FITEncoder.UINT16 },  // avg_power
      { num: 21, size: 2, type: FITEncoder.UINT16 },  // max_power
      { num: 18, size: 1, type: FITEncoder.UINT8 },   // avg_cadence (uint8)
      { num: 14, size: 2, type: FITEncoder.UINT16 },  // avg_speed
      { num: 16, size: 1, type: FITEncoder.UINT8 },   // avg_heart_rate
      { num: 17, size: 1, type: FITEncoder.UINT8 },   // max_heart_rate
    ]);

    const fitTimestamp = this.toFITTimestamp(summary.startTime);
    this.writeData(FITEncoder.MSG_SESSION, [
      ...this.uint32LE(fitTimestamp + summary.duration),
      ...this.uint32LE(fitTimestamp),
      ...this.uint32LE(summary.duration * 1000),
      ...this.uint32LE(summary.duration * 1000),
      ...this.uint32LE(Math.round(summary.totalDistance * 100)), // distance in cm
      2, // sport = cycling
      6, // sub_sport = indoor_cycling
      ...this.uint16LE(summary.avgPower),
      ...this.uint16LE(summary.maxPower),
      Math.min(255, summary.avgCadence), // uint8
      ...this.uint16LE(Math.round(summary.avgSpeed * 1000 / 3.6)), // m/s * 1000
      summary.avgHeartRate || 0xFF, // 0xFF = invalid if no HR data
      summary.maxHeartRate || 0xFF,
    ]);
  }

  writeLap(summary: { startTime: number; duration: number; avgPower: number; maxPower: number; avgCadence: number; totalDistance: number; avgSpeed: number; avgHeartRate: number; maxHeartRate: number }) {
    this.writeDefinition(FITEncoder.MSG_LAP, [
      { num: 253, size: 4, type: FITEncoder.UINT32 }, // timestamp
      { num: 2, size: 4, type: FITEncoder.UINT32 },   // start_time
      { num: 7, size: 4, type: FITEncoder.UINT32 },   // total_elapsed_time
      { num: 8, size: 4, type: FITEncoder.UINT32 },   // total_timer_time
      { num: 9, size: 4, type: FITEncoder.UINT32 },   // total_distance (m * 100)
      { num: 0, size: 1, type: FITEncoder.ENUM },     // event
      { num: 1, size: 1, type: FITEncoder.ENUM },     // event_type
      { num: 19, size: 2, type: FITEncoder.UINT16 },  // avg_power
      { num: 20, size: 2, type: FITEncoder.UINT16 },  // max_power
      { num: 17, size: 1, type: FITEncoder.UINT8 },   // avg_cadence
      { num: 13, size: 2, type: FITEncoder.UINT16 },  // avg_speed
      { num: 15, size: 1, type: FITEncoder.UINT8 },   // avg_heart_rate
      { num: 16, size: 1, type: FITEncoder.UINT8 },   // max_heart_rate
    ]);

    const fitTimestamp = this.toFITTimestamp(summary.startTime);
    this.writeData(FITEncoder.MSG_LAP, [
      ...this.uint32LE(fitTimestamp + summary.duration),
      ...this.uint32LE(fitTimestamp),
      ...this.uint32LE(summary.duration * 1000),
      ...this.uint32LE(summary.duration * 1000),
      ...this.uint32LE(Math.round(summary.totalDistance * 100)), // distance in cm
      9, // event = lap
      1, // event_type = stop
      ...this.uint16LE(summary.avgPower),
      ...this.uint16LE(summary.maxPower),
      Math.min(255, summary.avgCadence), // uint8
      ...this.uint16LE(Math.round(summary.avgSpeed * 1000 / 3.6)), // m/s * 1000
      summary.avgHeartRate || 0xFF,
      summary.maxHeartRate || 0xFF,
    ]);
  }

  private cumulativeDistance = 0;
  private lastRecordTimestamp = 0;

  writeRecord(data: TrainerData) {
    // Only define once
    if (!this.localMessageTypes.has(FITEncoder.MSG_RECORD)) {
      this.writeDefinition(FITEncoder.MSG_RECORD, [
        { num: 253, size: 4, type: FITEncoder.UINT32 }, // timestamp
        { num: 7, size: 2, type: FITEncoder.UINT16 },   // power
        { num: 4, size: 1, type: FITEncoder.UINT8 },    // cadence
        { num: 6, size: 2, type: FITEncoder.UINT16 },   // speed (m/s * 1000)
        { num: 5, size: 4, type: FITEncoder.UINT32 },   // distance (m * 100)
        { num: 3, size: 1, type: FITEncoder.UINT8 },    // heart_rate
      ]);
      this.lastRecordTimestamp = data.timestamp;
    }

    const fitTimestamp = this.toFITTimestamp(data.timestamp);
    const speedMps = Math.round(data.speed * 1000 / 3.6); // Convert km/h to m/s * 1000

    // Calculate distance increment based on speed and time delta
    const timeDeltaSec = (data.timestamp - this.lastRecordTimestamp) / 1000;
    if (timeDeltaSec > 0 && timeDeltaSec < 10) { // Sanity check
      const speedMs = data.speed / 3.6; // km/h to m/s
      this.cumulativeDistance += speedMs * timeDeltaSec;
    }
    this.lastRecordTimestamp = data.timestamp;

    // Distance in FIT is stored as meters * 100
    const distanceCm = Math.round(this.cumulativeDistance * 100);

    // Heart rate: use 0xFF (invalid) if not available
    const heartRate = data.heartRate ?? 0xFF;

    this.writeData(FITEncoder.MSG_RECORD, [
      ...this.uint32LE(fitTimestamp),
      ...this.uint16LE(data.power),
      data.cadence,
      ...this.uint16LE(speedMps),
      ...this.uint32LE(distanceCm),
      heartRate,
    ]);
  }

  finish(): ArrayBuffer {
    // Calculate CRC of data
    const dataCrc = this.calculateCRC(this.buffer.slice(14));

    // Add data CRC at end
    this.buffer.push(dataCrc & 0xFF, (dataCrc >> 8) & 0xFF);

    // Update data size in header
    const dataSize = this.dataSize;
    this.buffer[4] = dataSize & 0xFF;
    this.buffer[5] = (dataSize >> 8) & 0xFF;
    this.buffer[6] = (dataSize >> 16) & 0xFF;
    this.buffer[7] = (dataSize >> 24) & 0xFF;

    // Calculate and update header CRC
    const headerCrc = this.calculateCRC(this.buffer.slice(0, 12));
    this.buffer[12] = headerCrc & 0xFF;
    this.buffer[13] = (headerCrc >> 8) & 0xFF;

    return new Uint8Array(this.buffer).buffer;
  }

  private calculateCRC(data: number[]): number {
    const crcTable = [
      0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
      0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
    ];

    let crc = 0;
    for (const byte of data) {
      let tmp = crcTable[crc & 0xF];
      crc = (crc >> 4) & 0x0FFF;
      crc = crc ^ tmp ^ crcTable[byte & 0xF];

      tmp = crcTable[crc & 0xF];
      crc = (crc >> 4) & 0x0FFF;
      crc = crc ^ tmp ^ crcTable[(byte >> 4) & 0xF];
    }

    return crc;
  }
}
