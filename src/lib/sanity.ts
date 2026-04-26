import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import { env } from "./env";

type SanityImageSource = Parameters<ReturnType<typeof createImageUrlBuilder>["image"]>[0];

export const sanity = createClient({
  projectId:  env.SANITY_PROJECT_ID,
  dataset:    env.SANITY_DATASET,
  apiVersion: env.SANITY_API_VERSION,
  useCdn:     true,
  perspective: "published",
});

const imageBuilder = createImageUrlBuilder(sanity);
export const urlFor = (source: SanityImageSource) => imageBuilder.image(source);
