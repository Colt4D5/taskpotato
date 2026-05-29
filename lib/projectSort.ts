import { Project } from "@/types";

/**
 * Split active projects into pinned / unpinned groups, each sorted alphabetically.
 * Used by all project <select> dropdowns to surface pinned projects at the top.
 */
export function sortedProjectGroups(projects: Project[]): {
  pinned: Project[];
  unpinned: Project[];
  hasPinned: boolean;
} {
  const alpha = (a: Project, b: Project) => a.name.localeCompare(b.name);
  const pinned = projects.filter((p) => p.pinned).sort(alpha);
  const unpinned = projects.filter((p) => !p.pinned).sort(alpha);
  return { pinned, unpinned, hasPinned: pinned.length > 0 };
}
