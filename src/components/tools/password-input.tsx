"use client";

import { useState, useCallback } from "react";
import { Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  /** 确认密码值（用于匹配验证） */
  confirmValue?: string;
  /** 标签 */
  label?: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否显示强度指示器 */
  showStrength?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 错误信息 */
  error?: string;
  /** 输入框 ID */
  id?: string;
  /** 自动完成属性 */
  autoComplete?: "new-password" | "current-password" | "off";
}

export function PasswordInput({
  value,
  onChange,
  confirmValue,
  label = "密码",
  placeholder = "请输入密码",
  showStrength = true,
  disabled = false,
  error,
  id = "password",
  autoComplete = "new-password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      if (!touched) setTouched(true);
    },
    [onChange, touched]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  const handleToggleVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // 密码强度计算
  const getStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: "", color: "gray" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: "弱", color: "red" };
    if (score === 2) return { level: 2, label: "中等", color: "yellow" };
    if (score === 3) return { level: 3, label: "强", color: "green" };
    return { level: 4, label: "极强", color: "green" };
  };

  const strength = getStrength(value);
  const showStrengthBar = showStrength && value.length > 0;

  const isInvalid = touched && (error || (confirmValue !== undefined && value !== confirmValue));
  const isValid = touched && value.length > 0 && !isInvalid;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={cn(
          "block text-sm font-medium text-gray-700",
          disabled && "text-gray-400"
        )}
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border transition-colors",
            "placeholder:text-gray-400",
            disabled
              ? "bg-gray-50 text-gray-500 cursor-not-allowed"
              : "bg-white",
            isInvalid
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : isValid
              ? "border-green-300 focus:border-green-500 focus:ring-green-200"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          )}
          aria-invalid={!!isInvalid}
          aria-describedby={isInvalid ? `${id}-error` : showStrengthBar ? `${id}-strength` : undefined}
        />

        {/* 显示/隐藏按钮 */}
        <button
          type="button"
          onClick={handleToggleVisibility}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:text-gray-300 transition-colors"
          aria-label={showPassword ? "隐藏密码" : "显示密码"}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>

        {/* 状态图标 */}
        {(isValid || isInvalid) && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {isInvalid && (
        <p id={`${id}-error`} className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <AlertCircle className="h-3.5 w-3.5" />
          {error || (confirmValue !== undefined && value !== confirmValue ? "两次输入的密码不一致" : "密码格式不正确")}
        </p>
      )}

      {/* 强度指示器 */}
      {showStrengthBar && (
        <div className="space-y-1.5" id={`${id}-strength`} aria-live="polite">
          <div className="flex gap-1" role="progressbar" aria-valuenow={strength.level} aria-valuemin={0} aria-valuemax={4} aria-label="密码强度">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  level <= strength.level
                    ? strength.color === "red"
                      ? "bg-red-500"
                      : strength.color === "yellow"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    : "bg-gray-200"
                )}
              />
            ))}
          </div>
          <p className="text-xs" style={{ color: strength.color === "red" ? "red" : strength.color === "yellow" ? "#b45309" : "green" }}>
            密码强度：{strength.label}
            {strength.level < 3 && "（建议至少 8 位，包含大小写、数字、特殊字符）"}
          </p>
        </div>
      )}

      {/* 匹配验证提示 */}
      {confirmValue !== undefined && value && confirmValue && touched && value === confirmValue && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5" />
          两次输入的密码一致
        </p>
      )}
    </div>
  );
}