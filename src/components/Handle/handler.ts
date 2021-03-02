import { MouseEvent as ReactMouseEvent } from 'react';

import {
  ElementId,
  XYPosition,
  OnConnectFunc,
  OnConnectStartFunc,
  OnConnectStopFunc,
  OnConnectEndFunc,
  ConnectionMode,
  SetConnectionId,
  Connection,
} from '../../types';

type ValidConnectionFunc = (connection: Connection) => boolean;
export type SetSourceIdFunc = (params: SetConnectionId) => void;

export type SetPosition = (pos: XYPosition) => void;

type Result = {
  elementBelow: Element | null;
  isValid: boolean;
  connection: Connection;
  isHoveringHandle: boolean;
};

// checks if element below mouse is a handle and returns connection in form of an object { source: 123, target: 312 }
function checkElementBelowIsValid(
  event: MouseEvent,
  connectionMode: ConnectionMode,
  isTarget: boolean,
  isUniversal: boolean,
  nodeId: ElementId,
  handleId: ElementId | null,
  isValidConnection: ValidConnectionFunc,
  field?: boolean
) {
  const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
  const elementBelowIsTarget = elementBelow?.classList.contains('target') || false;
  const elementBelowIsSource = elementBelow?.classList.contains('source') || false;


  const result: Result = {
    elementBelow,
    isValid: false,
    connection: { source: null, target: null, sourceHandle: null, targetHandle: null },
    isHoveringHandle: false,
  };

  if (elementBelow && (elementBelowIsTarget || elementBelowIsSource)) {
    result.isHoveringHandle = true;
    const elementBelowHandleId = elementBelow.getAttribute('data-handleid');
    const elementIsField = elementBelow.getAttribute('data-handletype');
    // in strict mode we don't allow target to target or source to source connections 
    const isValid =
      connectionMode === ConnectionMode.Strict
      // This prevents same node connections (isUniversal && String(nodeId) !== elementBelow?.getAttribute('data-nodeid'))
      // Self referencing tables exist though so for now we'll prevent same handle connections
        ? (isTarget && elementBelowIsSource) || (!isTarget && elementBelowIsTarget) || (isUniversal && String(handleId) !== elementBelowHandleId)
        : true;

    if (isValid) {
      const elementBelowNodeId = elementBelow.getAttribute('data-nodeid');

      const connection: Connection = isTarget || isUniversal
        ? {
            source: elementBelowNodeId,
            sourceHandle: elementBelowHandleId,
            target: nodeId,
            targetHandle: handleId,
            sourceField: Boolean(elementIsField),
            targetField: field
          }
        : {
            source: nodeId,
            sourceHandle: handleId,
            target: elementBelowNodeId,
            targetHandle: elementBelowHandleId,
            sourceField: Boolean(elementIsField),
            targetField: field
          };

      result.connection = connection;
      result.isValid = isValidConnection(connection);
    }
  }

  return result;
}

function resetRecentHandle(hoveredHandle: Element): void {
  hoveredHandle?.classList.remove('react-flow__handle-valid');
  hoveredHandle?.classList.remove('react-flow__handle-connecting');
}

export function onMouseDown(
  event: ReactMouseEvent,
  handleId: ElementId | null,
  nodeId: ElementId,
  setConnectionNodeId: SetSourceIdFunc,
  setPosition: SetPosition,
  onConnect: OnConnectFunc,
  isTarget: boolean,
  isUniversal: boolean,
  isValidConnection: ValidConnectionFunc,
  connectionMode: ConnectionMode,
  onConnectStart?: OnConnectStartFunc,
  onConnectStop?: OnConnectStopFunc,
  onConnectEnd?: OnConnectEndFunc,
  field?: boolean
): void {
  const reactFlowNode = (event.target as Element).closest('.react-flow');
  
  if (!reactFlowNode) {
    return;
  }

  const handleType = isTarget ? 'target' : 'source';
  const containerBounds = reactFlowNode.getBoundingClientRect();
  let recentHoveredHandle: Element;

  setPosition({
    x: event.clientX - containerBounds.left,
    y: event.clientY - containerBounds.top,
  });


  setConnectionNodeId({ connectionNodeId: nodeId, connectionHandleId: handleId, connectionHandleType: handleType });
  onConnectStart?.(event, { nodeId, handleId, handleType });

  function onMouseMove(event: MouseEvent) {
    setPosition({
      x: event.clientX - containerBounds.left,
      y: event.clientY - containerBounds.top,
    });

    const { connection, elementBelow, isValid, isHoveringHandle } = checkElementBelowIsValid(
      event,
      connectionMode,
      isTarget,
      isUniversal,
      nodeId,
      handleId,
      isValidConnection,
      field
    );

    if (!isHoveringHandle) {
      return resetRecentHandle(recentHoveredHandle);
    }

    const isOwnHandle = connection.source === connection.target;

    if (!isOwnHandle && elementBelow) {
      recentHoveredHandle = elementBelow;
      elementBelow.classList.add('react-flow__handle-connecting');
      elementBelow.classList.toggle('react-flow__handle-valid', isValid);
    }
  }

  function onMouseUp(event: MouseEvent) {
    const { connection, isValid } = checkElementBelowIsValid(
      event,
      connectionMode,
      isTarget,
      isUniversal,
      nodeId,
      handleId,
      isValidConnection,
      field
    );

    onConnectStop?.(event);

    if (isValid) {
      onConnect?.(connection);
    }

    onConnectEnd?.(event);

    resetRecentHandle(recentHoveredHandle);
    setConnectionNodeId({ connectionNodeId: null, connectionHandleId: null, connectionHandleType: null });

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
