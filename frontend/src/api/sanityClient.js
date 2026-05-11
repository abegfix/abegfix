import { createClient } from "@sanity/client";

export default createClient({
  projectId: "zgaxfc4x", // Found in sanity.json or Sanity dashboard
  dataset: "production",
  useCdn: true, // fast delivery
  apiVersion: "2026-05-11",
});
