import { Injectable } from '@nestjs/common';

/**
 * TrackingService — business logic for the Tracking screen.
 *
 * Symptom categories are defined here (not in the controller) so they can
 * be reused by other services (e.g. validation, seed, health-report) without
 * importing the HTTP layer. A future iteration could persist these in MongoDB
 * to allow admin editing without a code deploy.
 */
@Injectable()
export class TrackingService {
  /**
   * All symptom category lists shown as pill buttons on the Tracking screen.
   * Matches the exact strings stored in MongoDB symptom log documents.
   */
 getSymptomCategories() {
  return {
    physicalPain: [
      '🤕 Cramps',
      '🚽 Diarrhoea',
      '😴 Fatigue',
      '🤯 Headache',
      '🤢 Nausea',
      '💢 Breast tenderness',
      '🤒 Abdominal pain',
      '🩹 Pelvic pain',
      '💧 Water retention',
      '🪑 Lower back pain',
      '🍔 Appetite changes',
    ],
    moodMental: [
      '😊 Happy',
      '😐 Neutral',
      '😢 Sad',
      '🥱 Low Motivation',
      '🎭 Mood swings',
      '😤 Irritability',
      '🍫 Cravings',
      '😭 Tearfulness',
      '🧠 Difficulty Concentrating',
    ],
    periodIndicators: [
      '🩸 Spotting',
      '🌊 Heavier flow',
      '💧 Lighter flow',
      '🏜️ Vaginal Dryness',
    ],
    sexualHealth: [
      '🔥 Increased sex drive',
      '🥶 Decreased sex drive',
      '💦 Vaginal discharge',
    ],
  };
}

  /**
   * Returns just the flat list of all valid symptom strings across all
   * categories — useful for validation in the symptoms service.
   */
  getAllValidSymptoms(): string[] {
    const cats = this.getSymptomCategories();
    return [
      ...cats.physicalPain,
      ...cats.moodMental,
      ...cats.periodIndicators,
      ...cats.sexualHealth,
    ];
  }
}