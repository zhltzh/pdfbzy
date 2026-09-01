/**
 * pdf-encrypt-lib 类型声明（vendored from github.com/alestre/pdf-encrypt-lib）
 * PDF Standard Security Handler (ISO 32000-2, R6, AES-256) built on pdf-lib.
 */

export interface EncryptOptions {
  /** 独立的所有者密码（默认与用户密码相同） */
  ownerPassword?: string;
  /** 权限位掩码（默认 DEFAULT_PERMISSIONS） */
  permissions?: number;
}

export interface DecryptResult {
  bytes: Uint8Array;
  /** 使用哪个密码验证成功的：true=所有者密码 */
  owner: boolean;
  permissions: number;
  permissionsValid: boolean;
}

/**
 * 用 AES-256 加密 PDF。
 * @param bytes 源 PDF 字节
 * @param password 打开密码
 */
export declare function encryptPdf(
  bytes: Uint8Array | ArrayBuffer,
  password: string,
  options?: EncryptOptions
): Promise<Uint8Array>;

/**
 * 移除 PDF 密码保护。
 * @throws Error: 'NOT_ENCRYPTED' | 'WRONG_PASSWORD' | 'CORRUPT_PDF' | 'XREF_STREAM_UNSUPPORTED' | 'INVALID_PASSWORD'
 */
export declare function decryptPdf(
  bytes: Uint8Array | ArrayBuffer,
  password: string
): Promise<DecryptResult>;

/** 修改已加密 PDF 的密码（先解密再重新加密） */
export declare function changePdfPassword(
  bytes: Uint8Array | ArrayBuffer,
  oldPassword: string,
  newPassword: string,
  options?: EncryptOptions
): Promise<Uint8Array>;

export declare const DEFAULT_PERMISSIONS: number;
