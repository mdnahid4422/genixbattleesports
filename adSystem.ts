
import { db, doc, updateDoc, increment, getDoc } from './firebase';

// CONFIGURATION
const AD_REWARD_EXP = 5;
const DAILY_LIMIT = 5;
const COOLDOWN_SECONDS = 40; 
const MIN_WATCH_TIME_MS = 25000; 
const AD_URL = "https://www.effectivegatecpm.com/fpn11b8pq5?key=2d72c821e1976e6e0db23ad4b4fd231b"; 

/**
 * লেভেল অনুযায়ী টার্গেট EXP রিটার্ন করে
 */
export const getRequiredExpForLevel = (level: number): number => {
  if (level === 1) return 100;
  if (level === 2) return 150;
  if (level === 3) return 300;
  if (level === 4) return 500;
  return 1000; // লেভেল ৫ এর পর থেকে ১০০০ করে লাগবে
};

export interface AdStatus {
  canWatch: boolean;
  timeLeft: number;
  dailyCount: number;
  message?: string;
}

class AdSystem {
  private lastWatchTimestamp: number = 0;

  async checkStatus(userId: string, profileData: any): Promise<AdStatus> {
    const today = new Date().toDateString();
    const lastDate = profileData.lastAdDate || "";
    const currentCount = lastDate === today ? (profileData.dailyAdsCount || 0) : 0;

    if (currentCount >= DAILY_LIMIT) {
      return { canWatch: false, timeLeft: 0, dailyCount: currentCount, message: "Daily Limit Reached! (5/5)" };
    }

    const now = Date.now();
    const elapsed = Math.floor((now - this.lastWatchTimestamp) / 1000);
    if (elapsed < COOLDOWN_SECONDS && this.lastWatchTimestamp !== 0) {
      return { canWatch: false, timeLeft: COOLDOWN_SECONDS - elapsed, dailyCount: currentCount };
    }

    return { canWatch: true, timeLeft: 0, dailyCount: currentCount };
  }

  async watchAdAndReward(userId: string, profileData: any): Promise<{ success: boolean; message: string }> {
    const status = await this.checkStatus(userId, profileData);
    if (!status.canWatch) return { success: false, message: status.message || `Please wait ${status.timeLeft}s for cooldown.` };

    return new Promise((resolve) => {
      const adWindow = window.open(AD_URL, '_blank');
      
      if (!adWindow) {
        resolve({ success: false, message: "Popup blocked! Please allow popups for this site." });
        return;
      }

      const startTime = Date.now();
      
      const checkInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;

        if (adWindow.closed) {
          clearInterval(checkInterval);
          
          if (elapsed < MIN_WATCH_TIME_MS) {
            const remaining = Math.ceil((MIN_WATCH_TIME_MS - elapsed) / 1000);
            resolve({ success: false, message: `Ad closed too early! You needed to watch for ${remaining} more seconds.` });
          } else {
            try {
              const today = new Date().toDateString();
              const userRef = doc(db, 'users', userId);
              
              const userSnap = await getDoc(userRef);
              const userData = userSnap.data();
              
              let currentLevel = userData?.level || 1;
              let currentExp = (userData?.exp || 0) + AD_REWARD_EXP;
              let totalExp = (userData?.totalExp || 0) + AD_REWARD_EXP;
              
              const requiredExp = getRequiredExpForLevel(currentLevel);

              let leveledUp = false;
              // Level up check
              if (currentExp >= requiredExp) {
                currentExp = 0; // লেভেল বাড়লে current exp রিসেট হয়ে ০ হবে
                currentLevel += 1;
                leveledUp = true;
              }

              await updateDoc(userRef, {
                exp: currentExp,
                totalExp: totalExp, // টোটাল exp কখনোই রিসেট হবে না
                level: currentLevel,
                dailyAdsCount: status.dailyCount + 1,
                lastAdDate: today
              });

              this.lastWatchTimestamp = Date.now();
              resolve({ 
                success: true, 
                message: leveledUp ? `LEVEL UP! Now Level ${currentLevel}` : `+${AD_REWARD_EXP} EXP Earned!` 
              });
            } catch (err) {
              resolve({ success: false, message: "Failed to sync rewards. Check your connection." });
            }
          }
        }
      }, 1000);
    });
  }
}

export const adManager = new AdSystem();
