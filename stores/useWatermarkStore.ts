import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 30) => {
  if (typeof window === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

const removeCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

interface WatermarkUserData {
  username: string | null;
  phoneNumber: string | null;
  fullName: string | null;
  loginTimestamp: string | null; // ISO string from local PC
}

interface WatermarkState {
  // Data
  userData: WatermarkUserData;
  
  // Actions
  setUserData: (username: string | null, phoneNumber: string | null, fullName: string | null) => void;
  clearUserData: () => void;
  getFormattedTimestamp: () => string;
}

export const useWatermarkStore = create<WatermarkState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        userData: {
          username: null,
          phoneNumber: null,
          fullName: null,
          loginTimestamp: null,
        },

        // Set user data with current timestamp from local PC
        setUserData: (username, phoneNumber, fullName) => {
          const loginTimestamp = new Date().toISOString(); // Current time from local PC
          set({
            userData: {
              username,
              phoneNumber,
              fullName,
              loginTimestamp,
            },
          });
          
          // Also save to cookies explicitly
          if (username) setCookie('watermark_username', username, 30);
          if (phoneNumber) setCookie('watermark_phone', phoneNumber, 30);
          if (fullName) setCookie('watermark_fullname', fullName, 30);
          setCookie('watermark_timestamp', loginTimestamp, 30);
        },

        // Clear user data
        clearUserData: () => {
          set({
            userData: {
              username: null,
              phoneNumber: null,
              fullName: null,
              loginTimestamp: null,
            },
          });
          
          // Clear cookies
          removeCookie('watermark_username');
          removeCookie('watermark_phone');
          removeCookie('watermark_fullname');
          removeCookie('watermark_timestamp');
        },

        // Get formatted timestamp for display
        getFormattedTimestamp: () => {
          const { loginTimestamp } = get().userData;
          if (!loginTimestamp) return '';
          
          try {
            const date = new Date(loginTimestamp);
            return date.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
          } catch (error) {
            return '';
          }
        },
      }),
      {
        name: 'watermark-storage',
        storage: {
          getItem: (name: string) => {
            // Try to get from cookies first
            const username = getCookie('watermark_username') || null;
            const phoneNumber = getCookie('watermark_phone') || null;
            const fullName = getCookie('watermark_fullname') || null;
            const loginTimestamp = getCookie('watermark_timestamp') || null;
            
            if (username || phoneNumber || fullName) {
              return JSON.stringify({
                state: {
                  userData: {
                    username,
                    phoneNumber,
                    fullName,
                    loginTimestamp,
                  },
                },
              });
            }
            
            // Fallback to localStorage
            try {
              const str = localStorage.getItem(name);
              return str;
            } catch (error) {
              return null;
            }
          },
          setItem: (name: string, value: unknown) => {
            try {
              const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
              const parsed = JSON.parse(valueStr);
              const userData = parsed.state?.userData;
              
              if (userData) {
                // Save to cookies
                if (userData.username) {
                  setCookie('watermark_username', userData.username, 30);
                }
                if (userData.phoneNumber) {
                  setCookie('watermark_phone', userData.phoneNumber, 30);
                }
                if (userData.fullName) {
                  setCookie('watermark_fullname', userData.fullName, 30);
                }
                if (userData.loginTimestamp) {
                  setCookie('watermark_timestamp', userData.loginTimestamp, 30);
                }
              }
              
              // Also save to localStorage as backup
              try {
                localStorage.setItem(name, valueStr);
              } catch (e) {
                // localStorage might not be available
              }
            } catch (error) {
              console.error('Error saving watermark data:', error);
            }
          },
          removeItem: (name: string) => {
            removeCookie('watermark_username');
            removeCookie('watermark_phone');
            removeCookie('watermark_fullname');
            removeCookie('watermark_timestamp');
            try {
              localStorage.removeItem(name);
            } catch (e) {
              // localStorage might not be available
            }
          },
        } as any,
        partialize: (state) => ({
          userData: state.userData,
        }),
      }
    ),
    { name: 'WatermarkStore' }
  )
);

