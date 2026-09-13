// 引入所有需要的圖片
import databaseIcon from '@/assets/icons/database.png';
import subscriptionIcon from '@/assets/icons/subscription.png';
import userManagementIcon from '@/assets/icons/user-management.png';
import statusIcon from '@/assets/icons/status.png';
import emailIcon from '@/assets/icons/email.png';
import sendEmailIcon from '@/assets/icons/send-email.png';
import propertyIcon from '@/assets/icons/property.png';
import priceIcon from '@/assets/icons/price.png';
import tableIcon from '@/assets/icons/table.png';
import customerIcon from '@/assets/icons/customer.png';
import blueprintIcon from '@/assets/icons/blueprint.png';
import inspectionCalenderIcon from '@/assets/icons/inspection-calender .png';
import reservationCalenderIcon from '@/assets/icons/reservation-calender.png';
import profileIcon from '@/assets/icons/profile.png';
import SMSIcon from '@/assets/icons/SMS.png';
import fileIcon from '@/assets/icons/file.png';


export const homeFeatures = [

 { 
    id: 'userProfile', 
    text: '個人資料', 
    icon: profileIcon, 
    permissionType: 'loggedIn', // 權限類型：只要登入就可見
    nav: { name: 'UserProfile' } // 導航目標：UserProfile 頁面
  },
   { 
    id: 'backupManagement', 
    text: '資料庫管理', 
    icon: databaseIcon, // 請替換為您的圖示
    permissionType: 'system', 
    permissionArgs: ['超級管理員'], // 權限檢查，只檢查 roles 是否包含 '超級管理員'
    nav: { name: 'BackupManagement' } 
  },
  { id: 'subscriptionManagement', text: '訂閱管理', icon: subscriptionIcon, permissionType: 'system', permissionArgs: ['系統管理員', '超級管理員'], nav: { name: 'SubscriptionManagement' } },
  { id: 'UserManagement', text: '人員管理', icon: userManagementIcon, permissionType: 'system', permissionArgs: ['人員管理'], nav: { name: 'UserManagement' } },
  { id: 'subscriptionStatus', text: '訂閱查詢', icon: statusIcon, permissionType: 'system', permissionArgs: ['訂閱查詢'], nav: { name: 'SubscriptionStatus' } },
  { id: 'messageCenter', text: '訊息中心', icon: emailIcon, permissionType: 'loggedIn', nav: { name: 'MessageCenter' } },
  { id: 'sendMessage', text: '發送訊息', icon: sendEmailIcon, permissionType: 'getter', permissionArgs: ['canSendMessage'], nav: { name: 'SendMessage' } },
  { id: 'inspectionSystem', text: '驗屋系統', icon: propertyIcon, permissionType: 'system', permissionArgs: ['驗屋系統'],  nav: { name: 'InspectionConsole' } },
  { id: 'quoteSystem', text: '報價系統', icon: priceIcon, permissionType: 'system', permissionArgs: ['報價系統'], nav: { name: 'QuoteSystemEntry', query: { viewMode: 'quote' } } },
  { id: 'salesSystem', text: '銷控系統', icon: tableIcon, permissionType: 'system', permissionArgs: ['銷控系統'], nav: { name: 'SalesControlSystemEntry', query: { viewMode: 'sales' } } },
  



  // ✓ START: 新增「客資系統」按鈕
  { 
    id: 'customerSystem', 
    text: '客資系統', 
    icon: customerIcon, 
    permissionType: 'anySystem', // 使用 'anySystem'
    permissionArgs: ['客資系統-櫃台', '客資系統-銷售'], // 檢查這兩個權限
    nav: { name: 'CustomerSystemEntry' } // 導向新的路由入口
  },
  // ✓ END: 新增按鈕

  { id: 'designChangeSystem', text: '客變系統', icon: blueprintIcon, permissionType: 'system', permissionArgs: ['客變系統'], nav: null },
  { id: 'inspectionTimetable', text: '驗屋預約', icon: inspectionCalenderIcon, permissionType: 'anySystem', permissionArgs:  ['驗屋預約管理-修改', '驗屋預約管理-檢視'], nav: { name: 'ProjectSelector' }
  },

  // 驗屋報告管理：獨立權限、獨立入口
  {
    id: 'inspectionReportManager',
    text: '驗屋報告',
    icon: fileIcon,
    permissionType: 'system',
    permissionArgs: ['驗屋報告管理'],
    nav: { name: 'InspectionReportManager' }
  },
   { 
    id: 'ViewingReservation', 
    text: '賞屋預約', 
    icon: reservationCalenderIcon, 
    permissionType: 'anySystem', // 使用 'anySystem'
    permissionArgs: ['客資系統-櫃台', '客資系統-銷售'], // 檢查這兩個權限
    nav: { name: 'ViewingReservationCalendarEntry' } // 導向新的路由入口
  },

  {
    id: 'smsMonitor',
    text: '簡訊監控',
    icon: SMSIcon, // 建議使用代表監控或狀態的圖示
    permissionType: 'system',
    permissionArgs: ['系統管理員','超級管理員'], // 依照您的 Home.vue 邏輯，會檢查角色是否包含此權限
    nav: { name: 'SmsReportMonitor' } // 導向您在 router/index.js 定義的名稱
  },

  // ✅ 新增：管理員工具中心
  {
    id: 'adminToolsCenter',
    text: '管理員工具',
    icon: userManagementIcon, // 使用現有的管理圖標
    permissionType: 'system',
    permissionArgs: ['系統管理員', '超級管理員'],
    nav: { name: 'AdminToolsCenter' }
  },

  // ✅ 試用留資管理（僅超級管理員；docs/SPEC_LandingTrialLeadsOnboarding.md §5）
  {
    id: 'trialLeads',
    text: '試用留資',
    icon: customerIcon,
    permissionType: 'system',
    permissionArgs: ['超級管理員'],
    nav: { name: 'TrialLeadsManager' }
  },

  // ✅ AI 助理管理（僅超級管理員；docs/銷控AI智能助理-spec.md §12）
  {
    id: 'aiAssistantAdmin',
    text: 'AI 助理管理',
    icon: userManagementIcon,
    permissionType: 'system',
    permissionArgs: ['超級管理員'],
    nav: { name: 'AiAssistantAdmin' }
  },

  // ✅ 客戶開發（僅超級管理員；docs/SPEC_CustomerProspecting.md §3.1）
  {
    id: 'prospecting',
    text: '客戶開發',
    icon: customerIcon,
    permissionType: 'system',
    permissionArgs: ['超級管理員'],
    nav: { name: 'ProspectManager' }
  },

  // 預約頁功能測試（僅超級管理員）
  {
    id: 'bookingTest',
    text: '預約頁測試',
    icon: inspectionCalenderIcon,
    permissionType: 'system',
    permissionArgs: ['超級管理員'],
    nav: { name: 'BookingTest' }
  },
];

// ✅ 試用帳號隱藏的管理類功能（docs/SPEC_LandingTrialLeadsOnboarding.md §3.7）
const HIDE_FOR_TRIAL = new Set([
  'backupManagement', 'subscriptionManagement', 'UserManagement', 'subscriptionStatus',
  'sendMessage', 'smsMonitor', 'adminToolsCenter', 'bookingTest', 'trialLeads', 'prospecting',
]);

// Home 與全站選單共用權限規則，功能入口本身仍由路由守衛驗證。
export function getAvailableHomeFeatures(userStore) {
  if (!userStore.user) return [];
  return homeFeatures.filter(button => {
    if (userStore.isTrialUser && HIDE_FOR_TRIAL.has(button.id)) return false;
    switch (button.permissionType) {
      case 'project':
        return userStore.hasProjectPermission(...button.permissionArgs);
      case 'anySystem':
        return userStore.hasAnyPermission(button.permissionArgs);
      case 'system': {
        const roles = button.permissionArgs.filter(arg => ['超級管理員', '系統管理員'].includes(arg));
        return roles.length
          ? roles.some(role => userStore.currentUserRoles.includes(role))
          : userStore.hasPermission(button.permissionArgs[0]);
      }
      case 'getter':
        return !!userStore[button.permissionArgs[0]];
      case 'loggedIn':
        return true;
      default:
        return false;
    }
  });
}
