import { RtcpSrPacket } from "./sr";
import { RtcpRrPacket } from "./rr";
import { RtcpHeader, HEADER_SIZE } from "./header";

export class RtcpPacket {
  static serialize(type: number, count: number, payload: Buffer) {
    const header = new RtcpHeader({
      type,
      count,
      version: 2,
      length: Math.floor(payload.length / 4),
    });
    const buf = header.serialize();
    return Buffer.concat([buf, payload]);
  }

  static deSerialize(data: Buffer) {
    let pos = 0;
    const packets = [];

    while (pos < data.length) {
      const header = RtcpHeader.deSerialize(data.slice(pos, pos + HEADER_SIZE));
      pos += HEADER_SIZE;

      const end = pos + header.length * 4;
      let payload = data.slice(pos, end);
      pos = end;

      if (header.padding) {
        payload = payload.slice(0, payload.length - payload.slice(-1)[0]);
      }

      switch (header.type) {
        case RtcpSrPacket.type:
          packets.push(RtcpSrPacket.deSerialize(payload, header.count));
          break;
        case RtcpRrPacket.type:
          packets.push(RtcpRrPacket.deSerialize(payload, header.count));
          break;
        default:
          throw new Error();
      }
    }

    return packets;
  }
}
