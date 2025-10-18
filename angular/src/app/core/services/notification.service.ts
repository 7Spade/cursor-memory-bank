import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * 通知服務
 * 單一職責：處理用戶通知和反饋
 * 遵循單一職責原則：只負責通知相關的業務邏輯
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  /**
   * 顯示成功通知
   * @param message 通知訊息
   * @param duration 顯示時間（毫秒）
   */
  showSuccess(message: string, duration: number = 3000): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    };
    
    this.snackBar.open(message, '關閉', config);
  }

  /**
   * 顯示錯誤通知
   * @param message 通知訊息
   * @param duration 顯示時間（毫秒）
   */
  showError(message: string, duration: number = 5000): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    };
    
    this.snackBar.open(message, '關閉', config);
  }

  /**
   * 顯示信息通知
   * @param message 通知訊息
   * @param duration 顯示時間（毫秒）
   */
  showInfo(message: string, duration: number = 3000): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    };
    
    this.snackBar.open(message, '關閉', config);
  }

  /**
   * 顯示警告通知
   * @param message 通知訊息
   * @param duration 顯示時間（毫秒）
   */
  showWarning(message: string, duration: number = 4000): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    };
    
    this.snackBar.open(message, '關閉', config);
  }

  /**
   * 顯示組織建立成功通知
   * @param organizationName 組織名稱
   */
  showOrganizationCreatedSuccess(organizationName: string): void {
    this.showSuccess(`組織 "${organizationName}" 建立成功！`, 3000);
  }

  /**
   * 顯示組織建立失敗通知
   * @param error 錯誤訊息
   */
  showOrganizationCreatedError(error: string): void {
    this.showError(`組織建立失敗：${error}`, 5000);
  }

  /**
   * 顯示團隊建立成功通知
   * @param teamName 團隊名稱
   */
  showTeamCreatedSuccess(teamName: string): void {
    this.showSuccess(`團隊 "${teamName}" 建立成功！`, 3000);
  }

  /**
   * 顯示團隊建立失敗通知
   * @param error 錯誤訊息
   */
  showTeamCreatedError(error: string): void {
    this.showError(`團隊建立失敗：${error}`, 5000);
  }

  /**
   * 顯示驗證錯誤通知
   * @param errors 錯誤訊息數組
   */
  showValidationErrors(errors: string[]): void {
    const errorMessage = errors.length === 1 
      ? errors[0] 
      : `請修正以下錯誤：\n${errors.join('\n')}`;
    
    this.showError(errorMessage, 5000);
  }

  /**
   * 顯示表單提交中通知
   */
  showSubmitting(): void {
    this.showInfo('正在提交...', 1000);
  }

  /**
   * 顯示網絡錯誤通知
   */
  showNetworkError(): void {
    this.showError('網絡連接失敗，請檢查您的網絡連接', 5000);
  }

  /**
   * 顯示權限不足通知
   */
  showPermissionDenied(): void {
    this.showError('您沒有權限執行此操作', 4000);
  }

  /**
   * 顯示自定義通知
   * @param message 通知訊息
   * @param type 通知類型
   * @param duration 顯示時間（毫秒）
   */
  showCustom(message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number): void {
    switch (type) {
      case 'success':
        this.showSuccess(message, duration);
        break;
      case 'error':
        this.showError(message, duration);
        break;
      case 'info':
        this.showInfo(message, duration);
        break;
      case 'warning':
        this.showWarning(message, duration);
        break;
    }
  }

  /**
   * 關閉所有通知
   */
  dismissAll(): void {
    this.snackBar.dismiss();
  }
}
