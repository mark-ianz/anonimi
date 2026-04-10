export const NOTIFICATION_SOUND_OPTIONS = [
  { value: "notification_1", label: "Tone 1", fileName: "notification_1.mp3" },
  { value: "notification_2", label: "Tone 2", fileName: "notification_2.mp3" },
  { value: "notification_3", label: "Tone 3", fileName: "notification_3.mp3" },
  { value: "notification_4", label: "Tone 4", fileName: "notification_4.mp3" },
  { value: "notification_5", label: "Tone 5", fileName: "notification_5.mp3" },
  { value: "notification_6", label: "Tone 6", fileName: "notification_6.mp3" },
] as const;

export type NotificationSound = (typeof NOTIFICATION_SOUND_OPTIONS)[number]["value"];

const getNotificationSoundUrl = (sound: NotificationSound) =>
  `/sounds/notification/${sound}.mp3`;

let activeAudio: HTMLAudioElement | null = null;

export const primeNotificationSound = (sound: NotificationSound) => {
  if (typeof window === "undefined" || typeof Audio === "undefined") return;

  const audio = new Audio(getNotificationSoundUrl(sound));
  audio.preload = "auto";
  audio.load();
};

export const playNotificationSound = async (sound: NotificationSound) => {
  if (typeof window === "undefined" || typeof Audio === "undefined") return false;

  const audio = new Audio(getNotificationSoundUrl(sound));
  audio.preload = "auto";
  audio.volume = 1;

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }

  activeAudio = audio;

  try {
    await audio.play();
    audio.addEventListener(
      "ended",
      () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }
      },
      { once: true }
    );
    return true;
  } catch {
    if (activeAudio === audio) {
      activeAudio = null;
    }
    return false;
  }
};
