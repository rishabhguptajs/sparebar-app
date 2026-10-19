# Consistency scoring sheet

Run `scripts/consistency-eval.ts --run`, open each result in the library, and score it. One row per result.

| Score | Meaning |
|---|---|
| 2 | Same person, clearly. A friend would say it is them. |
| 1 | Close, but something is off: hair, age, face shape. |
| 0 | A different person. |

Score the person (face and hair) and, for product posts, the product (shape and label text) separately. Outfit posts also get an outfit score: did the clothes match the request.

| Character | Post | Model | Person 0-2 | Product 0-2 | Outfit 0-2 | Notes |
|---|---|---|---|---|---|---|
| A | 1 | nano-banana-2.1 | | | | |

## Reading the result

- Average person score per model across all 30 posts. A model at 1.7 or higher can carry `consistent: true` in `src/config/model-meta.ts`, which shows the "Best for consistency" tag.
- Check the same posts with the old prompt (`prompt_version` p1) against p2 to see whether the prompt layer helped.
- A model that scores 0 on posts with a product and a person together likely ignores extra references. Note it, and lower its `maxRefs` in `src/config/model-refs.ts`.
- Video: animate the three still posts for the best two image models and score the clip's face against its first frame.
