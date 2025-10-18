import { Injectable } from '@angular/core';
import { ValidationResult, ValidationRule, ValidationConfig } from '../../shared/types/validation.types';

/**
 * 驗證服務
 * 單一職責：提供表單驗證邏輯
 * 遵循單一職責原則：只負責驗證相關的業務邏輯
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  /**
   * 驗證組織名稱
   * @param name 組織名稱
   * @returns 驗證結果
   */
  validateOrganizationName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('組織名稱不能為空');
    }
    
    if (name && name.length < 2) {
      errors.push('組織名稱至少需要2個字符');
    }
    
    if (name && name.length > 50) {
      errors.push('組織名稱不能超過50個字符');
    }
    
    if (name && !/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_]+$/.test(name)) {
      errors.push('組織名稱只能包含字母、數字、中文、空格、連字符和下劃線');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'name',
      value: name
    };
  }

  /**
   * 驗證登入名稱 (通用方法)
   * @param login 登入名稱
   * @returns 驗證結果
   */
  validateLogin(login: string): ValidationResult {
    const errors: string[] = [];
    
    if (!login || login.trim().length === 0) {
      errors.push('登入名稱不能為空');
    }
    
    if (login && login.length < 2) {
      errors.push('登入名稱至少需要2個字符');
    }
    
    if (login && login.length > 39) {
      errors.push('登入名稱不能超過39個字符');
    }
    
    if (login && !/^[a-zA-Z0-9\-_]+$/.test(login)) {
      errors.push('登入名稱只能包含字母、數字、連字符和下劃線');
    }
    
    if (login && (login.startsWith('-') || login.endsWith('-'))) {
      errors.push('登入名稱不能以連字符開頭或結尾');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'login',
      value: login
    };
  }

  /**
   * 驗證組織登入名稱
   * @param login 組織登入名稱
   * @returns 驗證結果
   */
  validateOrganizationLogin(login: string): ValidationResult {
    const errors: string[] = [];
    
    if (!login || login.trim().length === 0) {
      errors.push('組織登入名稱不能為空');
    }
    
    if (login && login.length < 2) {
      errors.push('組織登入名稱至少需要2個字符');
    }
    
    if (login && login.length > 39) {
      errors.push('組織登入名稱不能超過39個字符');
    }
    
    if (login && !/^[a-zA-Z0-9\-_]+$/.test(login)) {
      errors.push('組織登入名稱只能包含字母、數字、連字符和下劃線');
    }
    
    if (login && login.startsWith('-') || login.endsWith('-')) {
      errors.push('組織登入名稱不能以連字符開頭或結尾');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'login',
      value: login
    };
  }

  /**
   * 驗證組織描述
   * @param description 組織描述
   * @returns 驗證結果
   */
  validateOrganizationDescription(description: string): ValidationResult {
    const errors: string[] = [];
    
    if (description && description.length > 500) {
      errors.push('組織描述不能超過500個字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'description',
      value: description
    };
  }

  /**
   * 驗證團隊名稱
   * @param name 團隊名稱
   * @returns 驗證結果
   */
  validateTeamName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('團隊名稱不能為空');
    }
    
    if (name && name.length < 2) {
      errors.push('團隊名稱至少需要2個字符');
    }
    
    if (name && name.length > 50) {
      errors.push('團隊名稱不能超過50個字符');
    }
    
    if (name && !/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_]+$/.test(name)) {
      errors.push('團隊名稱只能包含字母、數字、中文、空格、連字符和下劃線');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'name',
      value: name
    };
  }

  /**
   * 驗證團隊 slug
   * @param slug 團隊 slug
   * @returns 驗證結果
   */
  validateTeamSlug(slug: string): ValidationResult {
    const errors: string[] = [];
    
    if (!slug || slug.trim().length === 0) {
      errors.push('團隊標識符不能為空');
    }
    
    if (slug && slug.length < 2) {
      errors.push('團隊標識符至少需要2個字符');
    }
    
    if (slug && slug.length > 39) {
      errors.push('團隊標識符不能超過39個字符');
    }
    
    if (slug && !/^[a-zA-Z0-9\-_]+$/.test(slug)) {
      errors.push('團隊標識符只能包含字母、數字、連字符和下劃線');
    }
    
    if (slug && (slug.startsWith('-') || slug.endsWith('-'))) {
      errors.push('團隊標識符不能以連字符開頭或結尾');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'slug',
      value: slug
    };
  }

  /**
   * 驗證團隊描述
   * @param description 團隊描述
   * @returns 驗證結果
   */
  validateTeamDescription(description: string): ValidationResult {
    const errors: string[] = [];
    
    if (description && description.length > 500) {
      errors.push('團隊描述不能超過500個字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'description',
      value: description
    };
  }

  /**
   * 驗證電子郵件
   * @param email 電子郵件
   * @returns 驗證結果
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || email.trim().length === 0) {
      errors.push('電子郵件不能為空');
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('請輸入有效的電子郵件地址');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'email',
      value: email
    };
  }

  /**
   * 驗證密碼
   * @param password 密碼
   * @returns 驗證結果
   */
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password || password.length === 0) {
      errors.push('密碼不能為空');
    }
    
    if (password && password.length < 8) {
      errors.push('密碼至少需要8個字符');
    }
    
    if (password && password.length > 128) {
      errors.push('密碼不能超過128個字符');
    }
    
    if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('密碼必須包含至少一個小寫字母、一個大寫字母和一個數字');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      field: 'password',
      value: password
    };
  }

  /**
   * 驗證多個字段
   * @param validations 驗證結果數組
   * @returns 整體驗證結果
   */
  validateMultiple(validations: ValidationResult[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;
    
    validations.forEach(validation => {
      if (!validation.isValid) {
        isValid = false;
        allErrors.push(...validation.errors);
      }
      
      if (validation.warnings) {
        allWarnings.push(...validation.warnings);
      }
    });
    
    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    };
  }

  /**
   * 生成 slug 從名稱
   * @param name 名稱
   * @returns slug
   */
  generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s\-_]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替換為連字符
      .replace(/-+/g, '-') // 多個連字符替換為單個
      .replace(/^-|-$/g, ''); // 移除開頭和結尾的連字符
  }
}
