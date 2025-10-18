import { ValidationUtils } from '../../core/utils/validation.utils';

/**
 * 組織驗證工具
 * 單一職責：組織數據驗證
 */
export class OrganizationValidator {
  /**
   * 驗證組織名稱
   */
  static validateOrganizationName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('組織名稱不能為空');
    }

    if (name && name.length < 2) {
      errors.push('組織名稱至少需要 2 個字符');
    }

    if (name && name.length > 50) {
      errors.push('組織名稱不能超過 50 個字符');
    }

    // 檢查特殊字符
    if (name && !/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_]+$/.test(name)) {
      errors.push('組織名稱只能包含字母、數字、中文、空格、連字符和下劃線');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證組織 slug
   */
  static validateOrganizationSlug(slug: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!slug || slug.trim().length === 0) {
      errors.push('組織 slug 不能為空');
    }

    if (slug && slug.length < 2) {
      errors.push('組織 slug 至少需要 2 個字符');
    }

    if (slug && slug.length > 30) {
      errors.push('組織 slug 不能超過 30 個字符');
    }

    // 檢查格式
    if (slug && !/^[a-z0-9\-_]+$/.test(slug)) {
      errors.push('組織 slug 只能包含小寫字母、數字、連字符和下劃線');
    }

    // 檢查是否以連字符開頭或結尾
    if (slug && (slug.startsWith('-') || slug.endsWith('-'))) {
      errors.push('組織 slug 不能以連字符開頭或結尾');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證組織描述
   */
  static validateOrganizationDescription(description?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (description && description.length > 500) {
      errors.push('組織描述不能超過 500 個字符');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證組織網站 URL
   */
  static validateOrganizationWebsite(website?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (website && website.trim().length > 0) {
      try {
        new URL(website);
      } catch {
        errors.push('無效的網站 URL 格式');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證完整的組織數據
   */
  static validateOrganizationData(data: {
    name: string;
    slug: string;
    description?: string;
    website?: string;
  }): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 驗證名稱
    const nameValidation = this.validateOrganizationName(data.name);
    errors.push(...nameValidation.errors);

    // 驗證 slug
    const slugValidation = this.validateOrganizationSlug(data.slug);
    errors.push(...slugValidation.errors);

    // 驗證描述
    const descriptionValidation = this.validateOrganizationDescription(data.description);
    errors.push(...descriptionValidation.errors);

    // 驗證網站
    const websiteValidation = this.validateOrganizationWebsite(data.website);
    errors.push(...websiteValidation.errors);

    // 警告檢查
    if (data.name && data.name.length < 5) {
      warnings.push('建議使用更長的組織名稱以便識別');
    }

    if (!data.description) {
      warnings.push('建議添加組織描述');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
