# OpenRouter prices (read 19 Oct 2026)

Source: openrouter.ai/api/v1/videos/models and /images/models/*/endpoints. OpenRouter passes provider prices through and charges 5.5% ($0.80 minimum) when you buy credits (crypto 5%).
Credits column is ceil(cost / $0.03), the same rule the app uses.

## Video (8 seconds)
Seedance rows are my estimate: 172,800 tokens for 8s at 720p 9:16 times the per-token rate.

| Model | $/sec (≈720p, audio if offered) | 8s clip | Credits | Notes |
|---|---|---|---|---|
| x-ai/grok-imagine-video-1.5-lite | 0.030 | $0.24 | 8 | 480p .02, 1080p .14. No separate audio switch |
| bytedance/seedance-1-5-pro | 0.052 | $0.41 | 14 | token billed; with audio. Without audio half |
| google/veo-3.1-lite | 0.050 | $0.40 | 14 | 1080p .08; without audio .03 |
| minimax/hailuo-3-max | 0.080 | $0.64 | 22 | 768p; 480p .05; no audio |
| minimax/hailuo-2.3 | 0.082 | $0.65 | 22 | 1080p only, no audio |
| x-ai/grok-imagine-video | 0.070 | $0.56 | 19 | 480p .05 |
| alibaba/happyhorse-1.0 | 0.099 | $0.79 | 27 | 1080p .1694 |
| alibaba/happyhorse-1.1 | 0.099 | $0.79 | 27 | 1080p .1278 |
| alibaba/wan-2.6 | 0.100 | $0.80 | 27 | image-to-video 720p; text-to-video .08; 1080p .15 |
| alibaba/wan-2.7 | 0.100 | $0.80 | 27 | 720p/1080p same price |
| alibaba/wan-3.0 | 0.100 | $0.80 | 27 | 480p .05, 1080p .20; up to 30s |
| heygen/heygen-video-1 | 0.036 | $0.29 | 10 | 768p; 480p .02; 2K .10; no audio flag |
| bytedance/seedance-2.0-mini | 0.076 | $0.60 | 21 | token billed |
| runway/gen-4.5 | 0.120 | $0.96 | 32 | 720p only, no audio |
| google/veo-3.1-fast | 0.100 | $0.80 | 27 | 1080p .12; 4K .30; without audio .08 |
| kwaivgi/kling-video-o1 | 0.112 | $0.90 | 30 | only 5s or 10s |
| alibaba/wan-3.0-prime | 0.140 | $1.12 | 38 | 480p .068, 1080p .28 |
| x-ai/grok-imagine-video-1.5 | 0.140 | $1.12 | 38 | 480p .08, 1080p .25 |
| bytedance/seedance-2.0-fast | 0.091 | $0.73 | 25 | token billed |
| kwaivgi/kling-v3.0-std | 0.126 | $1.01 | 34 | with audio; without .084 |
| minimax/hailuo-3 | 0.130 | $1.04 | 35 | 2K only |
| flux-3-video | 0.170 | $1.36 | 46 | 720p; 1080p .29; 2K .28; 4K .41 |
| kwaivgi/kling-v3.0-pro | 0.168 | $1.34 | 45 | with audio; without .112 |
| bytedance/seedance-2.0 | 0.151 | $1.21 | 41 | token billed; 1080p rate 7.7e-6; 4K 4e-6 |
| bytedance/seedance-2.5 | 0.231 | $1.85 | 62 | token billed; up to 30s |
| google/veo-3.1 | 0.400 | $3.20 | 107 | 1080p same; 4K .60; without audio .20 |
| runway/aleph-2 | 0.280 | $2.24 | 75 | video edit; min $0.56 per generation |
| heygen/avatar-iv | 0.050 | $0.40 | 14 | talking head from photo + voice; needs script |

Not in the table: flux-video-edit $0.03/s, flux-video-upscale $0.035-0.05 per megapixel-second.

## Image (one image)
Token-billed models (GPT Image 1/2/2.5, GPT-5 image, MAI Image, hy-image, Krea) have no flat price. GPT Image 2 output is $30 per 1M tokens, so roughly $0.04-0.20 depending on size and quality. Krea endpoints list no price.

| Model | $/image | Credits |
|---|---|---|
| recraft/recraft-v4.1-flash | 0.007 | 1 |
| flux-3-image-klein (1K) | 0.009 | 1 |
| flux.2-klein-4b (per MP) | 0.014 | 1 |
| seedream-5-0-flash | 0.018 | 1 |
| qwen-image-2.1-turbo | 0.0184 | 1 |
| sourceful/riverflow-v2.5-fast | 0.019 | 1 |
| sourceful/riverflow-v2-fast | 0.02 | 1 |
| qwen-image-3 (1K) | 0.03 | 1 |
| flux.2-pro (per MP) | 0.03 | 1 |
| gemini-nano-banana-2.1 (1K) | 0.0336 | 2 |
| seedream-5-0-lite | 0.035 | 2 |
| recraft-v4.1 / v4.1-utility / v4-styles | 0.035 | 2 |
| gemini-2.5-flash-image (Nano Banana) | 0.039 | 2 |
| seedream-4.5 | 0.04 | 2 |
| recraft-v4 / v3 | 0.04 | 2 |
| grok-imagine-image-2.0 (low 1K) | 0.04 | 2 |
| qwen-image-3-pro (1K) | 0.04 | 2 |
| gemini-3.1-flash-lite-image | 0.045 | 2 |
| seedream-5-0-pro | 0.045 | 2 |
| qwen-image-2.1-pro | 0.046 | 2 |
| flux-3-image (1K) | 0.048 | 2 |
| grok-imagine-image-quality (1K) | 0.05 | 2 |
| recraft-v4-styles-vector | 0.05 | 2 |
| gemini-3.1-flash-image (Nano Banana 2, 1K) | 0.067 | 3 |
| flux.2-max (per MP) | 0.07 | 3 |
| grok-imagine-image-2.0 (medium 2K) | 0.08 | 3 |
| recraft-v4.1-vector | 0.08 | 3 |
| flux-3-image (2K) | 0.1 | 4 |
| recraft-v4-styles-pro | 0.1 | 4 |
| riverflow-v2.5-pro | 0.13 | 5 |
| gemini-3-pro-image (Nano Banana Pro, 2K) | 0.134 | 5 |
| riverflow-v2-pro | 0.15 | 5 |
| recraft-v4.1-pro | 0.21 | 7 |
| recraft-v4-pro | 0.25 | 9 |
| recraft-v4.1-pro-vector / v4-pro-vector | 0.3 | 10 |
| flux-3-image (4K) | 0.607 | 21 |
