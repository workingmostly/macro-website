import type { ComponentType } from 'react';
import Close from './slides/Close';
import Colour from './slides/Colour';
import Cover from './slides/Cover';
import Days, { DAYS_LENGTH } from './slides/Days';
import Details from './slides/Details';
import Gearing from './slides/Gearing';
import Purpose from './slides/Purpose';
import Swipe, { SWIPE_LENGTH } from './slides/Swipe';
import Voice, { VOICE_LENGTH } from './slides/Voice';

export interface Slide {
  id: string;
  /** Output name, in posting order. */
  file: string;
  kind: 'still' | 'video';
  /** Seconds, for videos. */
  duration?: number;
  /** The moment shown as the still (and as a video's preview image). */
  poster?: number;
  Component: ComponentType<{ t: number }>;
}

export const SLIDES: Slide[] = [
  { id: 'cover', file: '01-cover', kind: 'still', Component: Cover },
  { id: 'why', file: '02-why', kind: 'still', Component: Purpose },
  { id: 'swipe', file: '03-swipe-to-log', kind: 'video', duration: SWIPE_LENGTH, poster: 2.6, Component: Swipe },
  { id: 'drag', file: '04-the-drag', kind: 'still', Component: Gearing },
  { id: 'colour', file: '05-colour', kind: 'still', Component: Colour },
  { id: 'details', file: '06-details', kind: 'still', Component: Details },
  { id: 'voice', file: '07-voice', kind: 'video', duration: VOICE_LENGTH, poster: 4.2, Component: Voice },
  { id: 'days', file: '08-days', kind: 'video', duration: DAYS_LENGTH, poster: 1.2, Component: Days },
  { id: 'close', file: '09-close', kind: 'still', Component: Close },
];
