/**
 * Starter seed stories for the feed. Original copy written in the app's voice.
 *
 * Seed content is the norm the first real posters imitate, so the mix is deliberate:
 * roughly a third green flags, and the red flags describe behaviour ("she cancelled three
 * times") rather than attacking the person.
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
  {
    content:
      "Asked me to pick her up forty minutes across town for a first date, then asked me to drive her to a different bar after, then to a friend's place. I felt like a rideshare with worse tips. If you don't drive that's fine, just say it upfront.",
    subject_name: "Tinder Tia",
    location: "San Jose, CA",
    verdict: -1,
  },
  {
    content:
      "Texted me the day after our first date to say she'd got home safe and had a good time. Nothing dramatic. Just didn't play the three-day-wait game, which after a year on these apps felt genuinely rare.",
    subject_name: "Hinge Ellis",
    location: "Raleigh, NC",
    verdict: 1,
  },
  {
    content:
      "Spent the whole date filming content. Not a joke — the drinks, the food, me from the shoulders down without asking. When I said I'd rather not be in it she called me insecure. Ask first and it's a non-issue.",
    subject_name: "Bumble Bryn",
    location: "Los Angeles, CA",
    verdict: -1,
  },
  {
    content:
      "I was thirty minutes late because of a wreck on the interstate and she was completely relaxed about it, already had a drink and a seat. Small thing but you learn a lot about someone from how they handle a minor inconvenience.",
    subject_name: "Hinge Marin",
    location: "Oklahoma City, OK",
    verdict: 1,
  },
  {
    content:
      "Every plan was contingent on something better not coming up. Confirmed Thursday, vague by Friday, cancelled Saturday afternoon twice in a row. Being someone's backup option is a slow way to find out you're not a priority.",
    subject_name: "Tinder Tash",
    location: "Memphis, TN",
    verdict: -1,
  },
  {
    content:
      "Two dates, both good, and then she told me she'd started seeing someone else more seriously and wanted to be straight with me rather than let it fizzle. Stung a bit. Still the right way to do it.",
    subject_name: "Bumble Bird",
    location: "Louisville, KY",
    verdict: 1,
  },
  {
    content:
      "Turned out she'd been to the same restaurant with two other guys that week and the staff clearly knew her. That's not the issue — dating multiple people early is normal. The issue was insisting to my face she hadn't dated anyone in months.",
    subject_name: "Hinge Noor",
    location: "Milwaukee, WI",
    verdict: -1,
  },
  {
    content:
      "We matched, talked for a week, met once, and both realised we were much better as friends. Actually still are. Not every match has to become something romantic to have been worth it.",
    subject_name: "Coffee Shop Wren",
    location: "Tucson, AZ",
    verdict: 0,
  },
  {
    content:
      "Told me she'd rather split the first one so neither of us felt like anything was owed. I hadn't thought about it that way before and honestly it took a lot of the weird pressure out of the evening.",
    subject_name: "Hinge June",
    location: "Albuquerque, NM",
    verdict: 1,
  },
  {
    content:
      "Constant comparisons to her friends' relationships. What he bought her, where they went, what he posted. By date three I understood I was auditioning for a role in someone else's highlight reel and not actually being dated.",
    subject_name: "Bumble Bell",
    location: "Fresno, CA",
    verdict: -1,
  },
  {
    content:
      "I have a kid every other weekend and mentioned it early because it's a dealbreaker for some people. She asked normal, interested questions instead of treating it like a problem to be managed. That's all it takes.",
    subject_name: "Hinge Tess",
    location: "Omaha, NE",
    verdict: 1,
  },
  {
    content:
      "Left mid-date to 'check on a friend' and never came back. I waited twenty five minutes, paid, went home. She texted three days later like nothing happened. I'd genuinely rather have been told to my face it wasn't working.",
    subject_name: "Tinder Toni",
    location: "Tulsa, OK",
    verdict: -1,
  },
  {
    content:
      "Nothing dramatic to report. Four dates, nice person, we just ran out of things to say to each other by the fourth. Ended it by text which normally I'd knock, but at four dates that felt about right.",
    subject_name: "Bumble Beth",
    location: "Wichita, KS",
    verdict: 0,
  },
  {
    content:
      "She noticed I was quiet on a bad-news day and instead of pushing she just changed the plan to something low-key and didn't make me perform being fine. I didn't ask her to do that. She just read the room.",
    subject_name: "Hinge Isla",
    location: "Richmond, VA",
    verdict: 1,
  },
  {
    content:
      "Sent me a long message about how much she valued honesty, then spent the next month being vague about literally everything — where she was, who she was with, what we were. The people who talk most about honesty are worth watching.",
    subject_name: "Tinder Trin",
    location: "New Orleans, LA",
    verdict: -1,
  },
  {
    content:
      "Made a point of asking what I actually wanted out of dating before we met, and when my answer didn't match hers she said so immediately instead of meeting up anyway. Saved us both an evening. More people should do this.",
    subject_name: "Bumble Beau",
    location: "Boise, ID",
    verdict: 1,
  },
  {
    content:
      "Every disagreement became a threat to leave. Not a real one, just enough to end the conversation on her terms. It works for a while and then you realise you've stopped raising anything at all.",
    subject_name: "Hinge Cleo",
    location: "Buffalo, NY",
    verdict: -1,
  },
  {
    content:
      "First date she suggested a walk instead of drinks because she said you learn more about someone when neither of you can hide behind a glass. She was right. Best first date I've had in two years.",
    subject_name: "Hinge Robin",
    location: "Madison, WI",
    verdict: 1,
  },
  {
    content:
      "Asked for money about six weeks in. Small at first, a genuine-sounding emergency, then a bigger one. I said no the second time and never heard from her again, which told me what the first one had been.",
    subject_name: "Tinder Tegan",
    location: "Jacksonville, FL",
    verdict: -1,
  },
  {
    content:
      "Went well, honestly. She's just at a completely different stage — wants kids soon, I'm nowhere near that. Neither of us wanted to waste the other's time pretending that gap would close. Wrong fit, no bad guy.",
    subject_name: "Bumble Blake",
    location: "Colorado Springs, CO",
    verdict: 0,
  },
  {
    content:
      "Was upfront that she wasn't looking for anything serious and then actually behaved that way — no mixed signals, no pulling me closer when I started to drift. It ended when it was always going to end and that was fine.",
    subject_name: "Hinge Wren",
    location: "Virginia Beach, VA",
    verdict: 1,
  },
  {
    content:
      "The version of her on the phone and the version in person were different people. Warm and funny over text, checked out and on her phone across the table. Three dates before I accepted the in-person one was the real one.",
    subject_name: "Bumble Britt",
    location: "Long Beach, CA",
    verdict: -1,
  },
  {
    content:
      "Met her parents around the four month mark and she'd clearly told them real things about me rather than a summary. Felt like being taken seriously. Not a dramatic story, just a good one.",
    subject_name: "Hinge Nell",
    location: "Saint Paul, MN",
    verdict: 1,
  },
  {
    content:
      "Kept bringing up things I'd said months earlier, slightly rewritten, as evidence in arguments. Not lying exactly, just shaded. Eventually I started keeping my own texts open during conversations, and that's when I knew.",
    subject_name: "Tinder Thea",
    location: "Bakersfield, CA",
    verdict: -1,
  },
  {
    content:
      "Good date, no spark, and she said so kindly at the end without the fake enthusiasm people use to avoid an awkward thirty seconds. I'd take that over three days of decoding a slow fade every single time.",
    subject_name: "Coffee Shop Nova",
    location: "Anaheim, CA",
    verdict: 0,
  },
];
