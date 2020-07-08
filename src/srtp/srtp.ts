import { Header } from "../rtp/rtp";
import { createCipheriv } from "crypto";
import { Context } from "./context";

export class Srtp {
  constructor(public context: Context) {}

  encryptRTP(dst: Buffer, plaintext: Buffer) {
    const header = Header.deSerialize(plaintext);

    return this._encryptRTP(dst, header, plaintext.slice(header.payloadOffset));
  }

  private _encryptRTP(dst: Buffer, header: Header, payload: Buffer) {
    dst = Buffer.concat([
      dst,
      Buffer.alloc(header.serializeSize + payload.length + 10),
    ]);

    const s = this.context.getSRTPSRRCState(header.ssrc);
    this.context.updateRolloverCount(header.sequenceNumber, s);

    header.serialize(dst.length).copy(dst);
    let n = header.payloadOffset;

    const counter = this.context.generateCounter(
      header.sequenceNumber,
      s.rolloverCounter,
      s.ssrc,
      this.context.srtpSessionSalt
    );

    const cipher = createCipheriv(
      "aes-128-ctr",
      this.context.srtpSessionKey,
      counter
    );
    const buf = cipher.update(payload);
    for (let i = n, j = 0; j < buf.length; i++, j++) {
      dst[i] = dst[i] ^ buf[j];
    }
    n += payload.length;

    const authTag = this.context.generateSrtpAuthTag(
      dst.slice(0, n),
      s.rolloverCounter
    );
    authTag.copy(dst, n);
    return dst;
  }
}

// package main

// import (
// 	"crypto/aes"
// 	"crypto/cipher"
// 	"fmt"
// )

// func main() {
// 	key := []byte{0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00}
// 	block, err := aes.NewCipher(key)
// 	if err != nil {
// 		fmt.Println("error",err)
// 	   return
// 	}
// 	iv :=[]byte{0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00}
// 	stream := cipher.NewCTR(block, iv)
// 	dst := []byte{0x00, 0x01, 0x02, 0x03, 0x04, 0x05}
// 		fmt.Println(dst)
// 	stream.XORKeyStream(dst, dst)
// 	fmt.Println(dst)
// }
