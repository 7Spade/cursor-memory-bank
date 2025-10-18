/**
 * 團隊驗證工具
 * 單一職責：團隊數據驗證
 */
export class TeamValidator {
  /**
   * 驗證團隊名稱
   */
  static validateTeamName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('團隊名稱不能為空');
    }

    if (name && name.length < 2) {
      errors.push('團隊名稱至少需要 2 個字符');
    }

    if (name && name.length > 50) {
      errors.push('團隊名稱不能超過 50 個字符');
    }

    // 檢查特殊字符
    if (name && !/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_]+$/.test(name)) {
      errors.push('團隊名稱只能包含字母、數字、中文、空格、連字符和下劃線');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證團隊 slug
   */
  static validateTeamSlug(slug: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!slug || slug.trim().length === 0) {
      errors.push('團隊 slug 不能為空');
    }

    if (slug && slug.length < 2) {
      errors.push('團隊 slug 至少需要 2 個字符');
    }

    if (slug && slug.length > 30) {
      errors.push('團隊 slug 不能超過 30 個字符');
    }

    // 檢查格式
    if (slug && !/^[a-z0-9\-_]+$/.test(slug)) {
      errors.push('團隊 slug 只能包含小寫字母、數字、連字符和下劃線');
    }

    // 檢查是否以連字符開頭或結尾
    if (slug && (slug.startsWith('-') || slug.endsWith('-'))) {
      errors.push('團隊 slug 不能以連字符開頭或結尾');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證團隊描述
   */
  static validateTeamDescription(description?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (description && description.length > 500) {
      errors.push('團隊描述不能超過 500 個字符');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證完整的團隊數據
   */
  static validateTeamData(data: {
    name: string;
    slug: string;
    description?: string;
  }): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 驗證名稱
    const nameValidation = this.validateTeamName(data.name);
    errors.push(...nameValidation.errors);

    // 驗證 slug
    const slugValidation = this.validateTeamSlug(data.slug);
    errors.push(...slugValidation.errors);

    // 驗證描述
    const descriptionValidation = this.validateTeamDescription(data.description);
    errors.push(...descriptionValidation.errors);

    // 警告檢查
    if (data.name && data.name.length < 5) {
      warnings.push('建議使用更長的團隊名稱以便識別');
    }

    if (!data.description) {
      warnings.push('建議添加團隊描述');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
