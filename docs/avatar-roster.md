# Premade avatar roster

The source is `src/config/avatars.ts`. `validateAvatars()` checks it and `src/config/avatars.test.ts` runs that check.

A brand picks an avatar and it is copied into their Characters list. The same face is then reused in every ad, so a weak or generic face hurts every post that uses it.

**Wiring note:** `buildPortraitPrompt` reads only `description` and `profile`. When you seed or generate portraits, add `look` to the end of the description, for example `${description} ${look}`. If you skip this, the realism and lighting guidance never reaches the model.

## Roster

| Name | Gender | Age | Look | Niches |
|---|---|---|---|---|
| Meera | W | mid 20s | Tamil, warm brown, oval, long black curls, nose stud, mole under the eye | beauty, lifestyle |
| Ananya | W | early 20s | Delhi, light, heart shaped, wavy dark brown with curtain bangs, faint acne marks | fashion, lifestyle |
| Pema | W | mid 20s | Sikkimese, fair, round, blunt black bob, scar through the eyebrow | fitness, tech, lifestyle |
| Ishita | W | late 20s | Bengali, wheatish, diamond, black low bun, kohl, chin mole | food, home |
| Kavya | W | early 30s | Malayali, dark brown, long face, shoulder length curls, nose ring | wellness, fitness |
| Simran | W | mid 30s | Punjabi, fair, square, hazel eyes, highlights with roots showing, plus size | fashion, food, lifestyle |
| Nandini | W | 40s | Maharashtrian, tan, round, grey streak at the temple, glasses on her head | home, wellness, food |
| Lakshmi | W | 50s | Telugu, brown, square, salt and pepper bun, bindi, crow's feet | wellness, home, food |
| Aisha | W | late 20s | Kashmiri, very fair, heart shaped, green eyes, gold rim glasses | tech, lifestyle |
| Amara | W | mid 20s | Nigerian British, deep, round, short coily afro, gold hoops | fitness, beauty |
| Mina | W | late 20s | Korean, light, oval, long black hair with wispy bangs, nose freckles | beauty, tech |
| Sofia | W | early 30s | Mexican American, olive, oval, long brown curls, beauty mark | food, home, lifestyle |
| Arjun | M | mid 20s | Delhi, light, square jaw, short wavy black hair, stubble, scar through the brow | fitness, fashion |
| Karthik | M | late 20s | Tamil, dark brown, oval, short curls, beard, thick rectangular glasses | tech, lifestyle |
| Rohan | M | early 20s | Mumbai, medium, round, chin length waves, ear stud, thin moustache | fashion, lifestyle |
| Jaskaran | M | early 30s | Sikh Punjabi, fair, long face, navy turban, full beard, muscular | fitness, food |
| Ritwik | M | mid 30s | Bengali, medium, oval, side part, receding hairline, round wire glasses | food, home, tech |
| Tenzin | M | late 20s | Sikkimese, light, diamond, textured crop, wispy moustache | tech, fashion |
| Vikram | M | 40s | Rajasthani, tan, square, greying temples, salt and pepper beard | tech, home, wellness |
| Rajan | M | 50s | Malayali, brown, round, receding grey hair, grey moustache, half rim glasses | wellness, food, home |
| Aditya | M | early 30s | Telugu, brown, long face, buzz cut, clean shaven, chin scar | fitness, wellness |
| Omar | M | early 30s | Lebanese, olive, diamond, hazel eyes, sharp beard, bump on the nose | fashion, food, lifestyle |
| Lucas | M | mid 20s | Western European, very fair, long face, blue eyes, freckles, messy light brown hair | tech, lifestyle, fashion |
| Marcus | M | 40s | Black American, deep, round, buzzed hair, greying beard, tortoiseshell glasses | tech, wellness, fitness |

## Distinctness rules

1. **No repeated combination.** No two people of the same gender share face shape, skin tone, age range, hair length and hair style. The validator enforces this.
2. **A signature trait visible at rest.** Reference portraits use a neutral front shot, so traits that only show in a smile do not count. That rules out dimples, tooth gaps and laugh lines as the main trait. Each person has at least one of these instead: a mole, freckles, a scar, glasses, a nose stud or ring, a turban, a grey streak, a hairline, or a distinctive brow or nose.
3. **Identity lives in `features`, not `wardrobe`.** Posts that set an outfit drop the wardrobe text, so glasses, the turban and jewellery that identify the person go in `features`.
4. **Spread the ensemble.**
   - 9 Indian regional looks plus 3 global looks per gender.
   - Every skin tone from very fair to deep.
   - All 6 face shapes among the women, and 5 among the men (no heart shaped face).
   - Every build across the roster, including plus size and muscular.
   - Two 40s faces and one 50s face per gender.
5. **No flattering adjectives in prompts.** Words like "beautiful", "stunning", "flawless" or "perfect skin" pull the model toward the same glossy model face. Attractiveness comes from good bone structure, healthy skin and grooming that is described plainly.
6. **No real people.** The roster contains no celebrity lookalikes and no named references.

## Realism additions (already in every `look`)

- Name the skin undertone, and describe visible pores and uneven tone.
- Include one or two honest imperfections, such as under-eye shadows, acne marks, redness or age spots.
- Include natural flyaways or messy strands.
- End with "no retouching, no beauty filter, slight phone sensor grain".
- Use soft natural window or daylight that fits the builder's fixed "plain background, natural light, shot on a phone camera" line. Do not ask for studio light or busy backgrounds.
- Keep expressions calm and specific. The front angle already asks for a neutral expression.

## Reviewer checklist for generated portraits

Reject and regenerate when you see any of these:

- **Plastic or airbrushed skin:** no pores, waxy shine, or an even "filter" glow.
- **Same face:** two avatars look like siblings. Compare thumbnails side by side in a grid of all 10.
- **Missing signature trait:** for example the mole, scar, glasses, nose stud, grey streak or turban is absent, or on the wrong side.
- **Wrong age:** people meant to be in their 40s or 50s render smooth and young, or people in their 20s look older.
- **Lightened skin or Westernised features:** skin tone is lighter than specified, or features are pulled toward a Western norm. This matters most for dark brown and deep skin.
- **Uncanny eyes:** mismatched pupils, a dead stare, catchlights that don't match, or the eyes are not level.
- **Bad teeth or hands:** too many teeth, merged teeth, or extra or fused fingers when hands are in frame.
- **Bad hair:** the hairline melts into the background, the hair has a helmet look, or there are no flyaways at all.
- **Bad glasses or jewellery:** frames merge into the skin, or earrings don't match.
- **Turban not rendered properly (Jaskaran):** the hair shows as a bare top knot instead of a tied turban.
- **Not "pass the brand test":** you would not put this person in your own ad.
