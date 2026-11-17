// Dev helper: sample entries for trying out the list and calendar.
// Loaded only when the URL has ?seed or ?unseed, and not part of the offline cache.
//
//   ?seed        add 20 sample entries to empty past days
//   ?seed=40     add 40
//   ?unseed      remove all sample entries (real entries are never touched)
//
// Sample entries are flagged `sample: true`. Today is never filled, and days
// that already have an entry are skipped.

import { addEntry, getEntry, deleteSampleEntries } from './db.js';
import { dateKey } from './dates.js';

const SAMPLES = [
  { mood: 4, notes: 'Productive morning, slow afternoon. Cooked a proper dinner for once.', standouts: 'Finally fixed the flaky test.' },
  { mood: 5, notes: 'Sun out all day. Spent the afternoon at the beach with friends.', standouts: 'Beach day with friends\nFish and chips on the sand' },
  { mood: 3, notes: 'Nothing special. Meetings, emails, groceries.', standouts: '' },
  { mood: 2, notes: 'Missed the train and got soaked walking from the station.', standouts: 'Hot shower afterwards' },
  { mood: 1, notes: 'Woke up with the flu. Stayed in bed most of the day.', standouts: 'Soup' },
  { mood: 2, notes: 'Still recovering. Low energy, cancelled plans.', standouts: 'A good nap' },
  { mood: 3, notes: 'Feeling more human. Short walk around the block.', standouts: 'Neighbour’s dog said hello' },
  { mood: 4, notes: 'Back at work. Good chat with the team about the roadmap.', standouts: 'Team lunch' },
  { mood: 5, notes: 'Shipped the release! Celebrated with the team after work.', standouts: 'Release went out without a hitch\nDrinks after work' },
  { mood: 4, notes: 'Long run along the river, then read for an hour.', standouts: 'New personal best on the 5k' },
  { mood: 3, notes: 'Rainy Sunday. Laundry and a movie.', standouts: '' },
  { mood: 4, notes: 'Tried the new café near the office.', standouts: 'Best flat white in ages' },
  { mood: 2, notes: 'Frustrating day. Production bug ate the whole afternoon.', standouts: 'Found the root cause at 6pm' },
  { mood: 3, notes: 'Quiet day catching up on admin.', standouts: 'Inbox zero' },
  { mood: 5, notes: 'Birthday dinner with family. Too much cake.', standouts: 'Birthday dinner!\nCall from an old friend' },
  { mood: 4, notes: 'Gardening in the morning, BBQ in the evening.', standouts: 'Tomatoes are finally ripening' },
  { mood: 1, notes: 'Bad news from home. Hard to focus on anything.', standouts: '' },
  { mood: 3, notes: 'Steadier today. Talked things through with a friend.', standouts: 'A long phone call' },
  { mood: 4, notes: 'Weekend hike up the hill behind town.', standouts: 'View from the top' },
  { mood: 3, notes: 'Ordinary Tuesday.', standouts: 'Leftovers were better the second day' },
];

/** Add `count` sample entries going back from yesterday, leaving a few gaps. */
export async function seed(count = 20) {
  let added = 0;
  let offset = 0;
  let i = 0;
  // Walk back up to ~2 years so re-seeding extends further into the past.
  while (added < count && offset < 730) {
    offset += 1;
    if (offset % 4 === 3) continue; // leave some empty days so the calendar has gaps

    const day = new Date();
    day.setHours(20, 30, 0, 0);
    day.setDate(day.getDate() - offset);
    const date = dateKey(day);
    if (await getEntry(date)) continue;

    const sample = SAMPLES[i % SAMPLES.length];
    i += 1;
    await addEntry({ date, ...sample, createdAt: day.getTime(), sample: true });
    added += 1;
  }
  return added;
}

export function unseed() {
  return deleteSampleEntries();
}
