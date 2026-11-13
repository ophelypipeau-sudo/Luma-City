/** The left portrait always uses this pose; the fitting room stays frontal. */
export const HIP_POSE_ASSETS = '/assets/avatar/poses/hand-on-hip-v3';
/** Fit the two original sleeve segments to the fixed elbow/wrist anchors.
 * Kept as a pose fallback for workshop tops; new cuts should supply drawn sleeves. */
export function armSegmentTransform(fromA:readonly number[],fromB:readonly number[],toA:readonly number[],toB:readonly number[]) {
  const ux=fromB[0]-fromA[0],uy=fromB[1]-fromA[1],vx=toB[0]-toA[0],vy=toB[1]-toA[1];
  const d=ux*ux+uy*uy,a=(vx*ux+vy*uy)/d,b=(vy*ux-vx*uy)/d;
  return `matrix(${a} ${b} ${-b} ${a} ${toA[0]-a*fromA[0]+b*fromA[1]} ${toA[1]-b*fromA[0]-a*fromA[1]})`;
}

