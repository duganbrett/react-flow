import React, { memo } from 'react';

import EdgeText from './EdgeText';

import { getMarkerEnd, getMarkerStart, getCenter } from './utils';
import { EdgeProps, Position } from '../../types';

interface GetBezierPathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
  centerX?: number;
  centerY?: number;
}

export function getBezierPath({
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
  centerX,
  centerY,
}: GetBezierPathParams): string {
  const [_centerX, _centerY] = getCenter({ sourceX, sourceY, targetX, targetY });
  const leftAndRight = [Position.Left, Position.Right];

  const cX = typeof centerX !== 'undefined' ? centerX : _centerX;
  const cY = typeof centerY !== 'undefined' ? centerY : _centerY;

  let path = `M${sourceX},${sourceY} C${sourceX},${cY} ${targetX},${cY} ${targetX},${targetY}`;

  if (leftAndRight.includes(sourcePosition) && leftAndRight.includes(targetPosition)) {
    path = `M${sourceX},${sourceY} C${cX},${sourceY} ${cX},${targetY} ${targetX},${targetY}`;
  } else if (leftAndRight.includes(targetPosition)) {
    path = `M${sourceX},${sourceY} C${sourceX},${targetY} ${sourceX},${targetY} ${targetX},${targetY}`;
  } else if (leftAndRight.includes(sourcePosition)) {
    path = `M${sourceX},${sourceY} C${targetX},${sourceY} ${targetX},${sourceY} ${targetX},${targetY}`;
  }

  return path;
}

const getOffsetX = (position: Position) => {
  return position === Position.Left || position === Position.Right ?  (10 * (position === Position.Left ? -1 : 1)) : 0
}
 const getOffsetY = (position: Position) => {
  return position === Position.Top || position === Position.Bottom ?  (10 * (position === Position.Bottom ? 1 : -1)) : 0
} 

export default memo(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Bottom,
    targetPosition = Position.Top,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    style,
    arrowHeadType,
    markerEndId,
    startArrowHeadType,
    markerStartId
  }: EdgeProps) => {

    const sourceOffsetX = startArrowHeadType ? getOffsetX(sourcePosition) : 0;
    const sourceOffsetY = startArrowHeadType ? getOffsetY(sourcePosition) : 0;
    const targetOffsetX = arrowHeadType ? getOffsetX(targetPosition) : 0;
    const targetOffsetY = arrowHeadType ? getOffsetY(targetPosition) : 0;

    const [centerX, centerY] = getCenter({ sourceX, sourceY, targetX, targetY });
    const path = getBezierPath({
      sourceX: sourceX + sourceOffsetX,
      sourceY: sourceY + sourceOffsetY,
      sourcePosition,
      targetX: targetX + targetOffsetX,
      targetY: targetY + targetOffsetY,
      targetPosition,
    });

    const text = label ? (
      <EdgeText
        x={centerX}
        y={centerY}
        label={label}
        labelStyle={labelStyle}
        labelShowBg={labelShowBg}
        labelBgStyle={labelBgStyle}
        labelBgPadding={labelBgPadding}
        labelBgBorderRadius={labelBgBorderRadius}
      />
    ) : null;

    const markerEnd = getMarkerEnd(arrowHeadType + `_${targetPosition.toLowerCase()}` as any, markerEndId);
    const markerStart = getMarkerStart(startArrowHeadType + `_${sourcePosition.toLowerCase()}` as any, markerStartId);

    return (
      <>
        <path style={style} d={path} className="react-flow__edge-path" markerStart={markerStart} markerEnd={markerEnd} />
        {text}
      </>
    );
  }
);
