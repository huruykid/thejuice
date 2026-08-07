/**
 * Starter seed stories for the feed.
 *
 * Original fiction written in the app's voice — no scraped or copied text, and no real
 * people. That matters twice over here: republished text carries someone else's copyright,
 * and a story about a real, identifiable woman published by Juice itself is a claim *Juice*
 * made rather than third-party content, which is exactly the material a platform has no
 * intermediary shield for. These are invented, so neither applies.
 *
 * They also set the community's tone. Seed content is the norm the first real posters
 * imitate, so the mix here is deliberate: roughly a third green flags, and the red flags
 * describe behaviour ("she cancelled three times") rather than attacking the person.
 *
 * Loaded into the bulk editor on /admin/seed, where each one can be edited or dropped
 * before publishing.
 */

export interface SeedStoryDraft {
  content: string;
  subject_name: string;
  location: string;
  /** -1 milk (red flag) / 0 none / +1 juice (green flag) */
  verdict: -1 | 0 | 1;
}

export const SEED_STORY_LIBRARY: SeedStoryDraft[] = [
  {
    content:
      "Talked every day for about six weeks. Deep conversations, called each other most nights, made plans for a trip in the spring. Then she just stopped replying. No fight, no fade, nothing. Two weeks later I saw she'd been active the whole time. If you're not feeling it anymore that's completely fine, just say the words.",
    subject_name: "Hinge Harper",
    location: "Austin, TX",
    verdict: -1,
  },
  {
    content:
      "One drink, about two hours, and at the end she said straight out that she'd had a good time but didn't feel a romantic spark. No excuses, no 'let's see where it goes' when she already knew. I was a little disappointed but honestly I respected it a lot. That's how it should go.",
    subject_name: "Bumble Bex",
    location: "Denver, CO",
    verdict: 1,
  },
  {
    content:
      "We'd had the conversation about not seeing other people. Two weeks later a buddy sends me a screenshot of her profile, still up, still active that day. When I asked she said the app 'must have refreshed it.' Apps don't do that. Just be honest about what you want.",
    subject_name: "Tinder Tess",
    location: "Chicago, IL",
    verdict: -1,
  },
  {
    content:
      "Second date she planned the whole thing herself because I'd mentioned I was slammed at work that week. Nothing expensive, just a walk and a coffee place she liked. The effort was the point. We're still seeing each other.",
    subject_name: "Hinge Hana",
    location: "Seattle, WA",
    verdict: 1,
  },
  {
    content:
      "Nice person, genuinely. We just wanted completely different things — she's moving abroad next year and I'm buying a place here. Three dates, figured it out, ended it like adults. Not every story has a villain.",
    subject_name: "Coffee Shop Cam",
    location: "Portland, OR",
    verdict: 0,
  },
  {
    content:
      "Four dates, four times I paid. That's fine, I offered. What got me was the fifth time she picked the most expensive place in town, ordered for the table, and then took a call outside when the bill came. Never heard from her again after that night.",
    subject_name: "Bumble Bri",
    location: "Miami, FL",
    verdict: -1,
  },
  {
    content:
      "I got food poisoning the night before our third date. Told her I had to cancel and expected that to be that. She dropped off soup and electrolyte drinks at my door and left without coming in because she didn't want to make it weird. Six months in now.",
    subject_name: "Hinge Hollis",
    location: "Nashville, TN",
    verdict: 1,
  },
  {
    content:
      "Hot for three days, cold for five, then a 'hey stranger' right when I'd stopped thinking about it. Every single time. It went on for two months before I realised I was being kept warm, not dated. Consistency is the whole game.",
    subject_name: "Tinder Tori",
    location: "Los Angeles, CA",
    verdict: -1,
  },
  {
    content:
      "First message she said she was looking for something serious and wasn't interested in a long texting phase. We met that same week. Whatever happens, I appreciated knowing exactly where I stood from the jump instead of guessing for a month.",
    subject_name: "Hinge Devon",
    location: "Atlanta, GA",
    verdict: 1,
  },
  {
    content:
      "Photos were clearly a few years old and she said as much when we met, which I actually respected. What I didn't love was finding out the job, the city she'd 'just moved from', and the sister she talked about constantly were all embellished too. The photos were never the issue.",
    subject_name: "Bumble Bailey",
    location: "Phoenix, AZ",
    verdict: -1,
  },
  {
    content:
      "Month in, she invited me to her friend's birthday. Introduced me properly, no weird ambiguity about what I was to her. Small thing but after a year of situationships it felt like being treated like a person.",
    subject_name: "Hinge Quinn",
    location: "Boston, MA",
    verdict: 1,
  },
  {
    content:
      "Matched while she was here for work. Great week, genuinely. We both tried the long distance thing for two months and it just wore out. No bad behaviour on either side, it was a distance problem. Posting it because not every entry needs to be a warning.",
    subject_name: "Tinder Tam",
    location: "San Diego, CA",
    verdict: 0,
  },
  {
    content:
      "Showed up to the first date with a friend she hadn't mentioned. I get safety, I really do, and I'd have been fine with it if she'd said something beforehand. Instead I spent ninety minutes being interviewed by two people. Just give a heads up.",
    subject_name: "Bumble Blair",
    location: "Dallas, TX",
    verdict: -1,
  },
  {
    content:
      "She reached for her card before I did and split it without making it a whole conversation or a test. No scorekeeping, no performance. Second date she let me get it. That's how normal people do it.",
    subject_name: "Hinge Hayden",
    location: "Minneapolis, MN",
    verdict: 1,
  },
  {
    content:
      "Two hours about her ex. Not in a healing way — in a still-checking-his-location way. I asked twice about her own life and got redirected both times. She's not ready and that's okay, but don't spend someone else's evening on it.",
    subject_name: "Coffee Shop Kris",
    location: "Philadelphia, PA",
    verdict: -1,
  },
  {
    content:
      "I mentioned offhand on date one that I'd been trying to get back into running. Date three she'd found a 5K near me and asked if I wanted to sign up together. Listening is underrated.",
    subject_name: "Hinge Reese",
    location: "Charlotte, NC",
    verdict: 1,
  },
  {
    content:
      "Cancelled three times. First one was genuine, no complaints. Second was two hours before. Third was after I'd already parked. Each time she rebooked immediately which kept me hoping. I should have stopped at two.",
    subject_name: "Bumble Bree",
    location: "Las Vegas, NV",
    verdict: -1,
  },
  {
    content:
      "Good conversation, good manners, we just had zero chemistry and both knew it by the second drink. Ended up talking about it openly and laughing. She's a genuinely decent person, just not for me.",
    subject_name: "Tinder Tay",
    location: "Columbus, OH",
    verdict: 0,
  },
  {
    content:
      "I said early on I wanted to take the physical side slow because of how my last relationship ended. She didn't push once, didn't sulk about it, didn't bring it up as leverage in an argument later. It sounds like a low bar and it isn't.",
    subject_name: "Hinge Sage",
    location: "Salt Lake City, UT",
    verdict: 1,
  },
  {
    content:
      "Ten days of good morning texts, talk of meeting my family, a nickname by day four. Then nothing, mid-conversation. The intensity at the start was the warning sign and I missed it completely. Pace is information.",
    subject_name: "Bumble Bec",
    location: "Houston, TX",
    verdict: -1,
  },
  {
    content:
      "We had a real argument about two months in, the kind where you both say something dumb. Next day she called and apologised for her part without me asking and without a 'but'. I'd never had that before. Learned something about what I should expect.",
    subject_name: "Hinge Marlow",
    location: "Kansas City, MO",
    verdict: 1,
  },
  {
    content:
      "Anything I told her in a vulnerable moment came back at me during the next disagreement, word for word. Eventually I just stopped telling her things, which is when I knew it was over. Don't hand someone ammunition and call it intimacy.",
    subject_name: "Tinder Tatum",
    location: "Detroit, MI",
    verdict: -1,
  },
  {
    content:
      "I got laid off six weeks into seeing her, which is exactly the point where most people quietly disappear. She didn't. Didn't make it her problem either, just kept showing up normally. That told me more than any date could have.",
    subject_name: "Hinge Rory",
    location: "Baltimore, MD",
    verdict: 1,
  },
  {
    content:
      "Genuinely liked her. She was three weeks out of a five year relationship and said so honestly, which I appreciated. We both knew the timing was wrong and stopped before it got complicated. No hard feelings, just wrong month.",
    subject_name: "Bumble Bo",
    location: "Sacramento, CA",
    verdict: 0,
  },
];
