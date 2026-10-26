import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let modelPromise = null;

export async function loadDetector() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await tf.ready();
      return await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    })();
  }
  return modelPromise;
}

export class DirectionCalculator {
  static LEFT_THRESHOLD = 0.35;
  static RIGHT_THRESHOLD = 0.65;
  static MIN_AREA_THRESHOLD = 0.02; // Filter small objects < 2% of frame

  static calculateDirection(bbox, frameWidth) {
    if (!frameWidth || frameWidth <= 0) return 'CENTER';
    const [x, y, width, height] = bbox;
    const centerX = x + width / 2;
    const normalizedX = Math.max(0, Math.min(1, centerX / frameWidth));

    if (normalizedX < this.LEFT_THRESHOLD) return 'LEFT';
    if (normalizedX > this.RIGHT_THRESHOLD) return 'RIGHT';
    return 'CENTER';
  }

  static isSignificant(bbox, frameWidth, frameHeight) {
    if (!frameWidth || !frameHeight) return false;
    const [, , width, height] = bbox;
    const boxArea = width * height;
    const frameArea = frameWidth * frameHeight;
    return (boxArea / frameArea) >= this.MIN_AREA_THRESHOLD;
  }
}

export class AlertCooldownManager {
  constructor({ defaultCooldownMs = 3000, urgentCenterCooldownMs = 2000 } = {}) {
    this.defaultCooldownMs = defaultCooldownMs;
    this.urgentCenterCooldownMs = urgentCenterCooldownMs;
    this.lastZoneAlerts = new Map();
    this.lastLabelAlerts = new Map();
  }

  evaluateCue(cue, now = Date.now()) {
    const cooldown = cue.direction === 'CENTER' ? this.urgentCenterCooldownMs : this.defaultCooldownMs;

    const lastZoneTime = this.lastZoneAlerts.get(cue.direction);
    if (lastZoneTime && (now - lastZoneTime < cooldown)) {
      return null;
    }

    const lastLabelTime = this.lastLabelAlerts.get(cue.label);
    if (lastLabelTime && (now - lastLabelTime < cooldown)) {
      return null;
    }

    this.lastZoneAlerts.set(cue.direction, now);
    this.lastLabelAlerts.set(cue.label, now);

    return this.formatAlert(cue);
  }

  selectPriorityCue(cues) {
    if (!cues || cues.length === 0) return null;
    const centerCues = cues.filter(c => c.direction === 'CENTER');
    if (centerCues.length > 0) {
      return centerCues.reduce((max, c) => (c.score > max.score ? c : max), centerCues[0]);
    }
    return cues.reduce((max, c) => (c.score > max.score ? c : max), cues[0]);
  }

  formatAlert(cue) {
    const label = cue.label.charAt(0).toUpperCase() + cue.label.slice(1);
    switch (cue.direction) {
      case 'CENTER':
        return `${label} directly ahead`;
      case 'LEFT':
        return `${label} on your left`;
      case 'RIGHT':
        return `${label} on your right`;
      default:
        return `${label} detected`;
    }
  }

  reset() {
    this.lastZoneAlerts.clear();
    this.lastLabelAlerts.clear();
  }
}
