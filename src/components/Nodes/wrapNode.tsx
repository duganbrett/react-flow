import React, { useEffect, useRef, memo, ComponentType, CSSProperties, useMemo, MouseEvent, useCallback } from 'react';
import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';
import cc from 'classcat';

import { useStoreActions } from '../../store/hooks';
import { Provider } from '../../contexts/NodeIdContext';
import { NodeComponentProps, WrapNodeProps } from '../../types';



export default (NodeComponent: ComponentType<NodeComponentProps>) => {
  const NodeWrapper = ({
    id,
    type,
    data,
    scale,
    xPos,
    yPos,
    selected,
    // nodes,
    isValidConnection,
    onAddField,
    onTitleChange,
    onFieldChange,
    onRemoveField,
    onClick,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    onContextMenu,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    style,
    className,
    isDraggable,
    isSelectable,
    isConnectable,
    selectNodesOnDrag,
    sourcePosition,
    targetPosition,
    isHidden,
    isInitialized,
    snapToGrid,
    snapGrid,
    isDragging,
    resizeObserver,
  }: WrapNodeProps) => {
    const updateNodeDimensions = useStoreActions((actions) => actions.updateNodeDimensions);
    const addSelectedElements = useStoreActions((actions) => actions.addSelectedElements);
    const updateNodePosDiff = useStoreActions((actions) => actions.updateNodePosDiff);
    const unsetNodesSelection = useStoreActions((actions) => actions.unsetNodesSelection);
    //const updateElements = useStoreActions((actions) => actions.setElements);
    const nodeElement = useRef<HTMLDivElement>(null);

    const node: any = useMemo(() => ({ id, type, position: { x: xPos, y: yPos }, data }), [id, type, xPos, yPos, data]);
    const grid = useMemo(() => (snapToGrid ? snapGrid : [1, 1])! as [number, number], [snapToGrid, snapGrid]);

    const nodeStyle: CSSProperties = useMemo(
      () => ({
        zIndex: selected ? 10 : 3,
        transform: `translate(${xPos}px,${yPos}px)`,
        pointerEvents: isSelectable || isDraggable || onClick ? 'all' : 'none',
        opacity: isInitialized ? 1 : 0, // prevents jumping of nodes on start
        ...style,
      }),
      [selected, xPos, yPos, isSelectable, isDraggable, onClick, isInitialized, style]
    );
    const onMouseEnterHandler = useMemo(() => {
      if (!onMouseEnter || isDragging) {
        return;
      }

      return (event: MouseEvent) => onMouseEnter(event, node);
    }, [onMouseEnter, isDragging, node]);

    const onMouseMoveHandler = useMemo(() => {
      if (!onMouseMove || isDragging) {
        return;
      }

      return (event: MouseEvent) => onMouseMove(event, node);
    }, [onMouseMove, isDragging, node]);

    const onMouseLeaveHandler = useMemo(() => {
      if (!onMouseLeave || isDragging) {
        return;
      }

      return (event: MouseEvent) => onMouseLeave(event, node);
    }, [onMouseLeave, isDragging, node]);

    const onContextMenuHandler = useMemo(() => {
      if (!onContextMenu) {
        return;
      }

      return (event: MouseEvent) => onContextMenu(event, node);
    }, [onContextMenu, node]);

    const onSelectNodeHandler = useCallback(
      (event: MouseEvent) => {
        if (!isDraggable) {
          if (isSelectable) {
            unsetNodesSelection();

            if (!selected) {
              addSelectedElements(node);
            }
          }

          onClick?.(event, node);
        }
      },
      [isSelectable, selected, isDraggable, onClick, node]
    );

    const onDragStart = useCallback(
      (event: DraggableEvent) => {
        onNodeDragStart?.(event as MouseEvent, node);

        if (selectNodesOnDrag && isSelectable) {
          unsetNodesSelection();

          if (!selected) {
            addSelectedElements(node);
          }
        } else if (!selectNodesOnDrag && !selected && isSelectable) {
          unsetNodesSelection();
          addSelectedElements([]);
        }
      },
      [node, selected, selectNodesOnDrag, isSelectable, onNodeDragStart]
    );

    const onDrag = useCallback(
      (event: DraggableEvent, draggableData: DraggableData) => {
        if (onNodeDrag) {
          node.position.x += draggableData.deltaX;
          node.position.y += draggableData.deltaY;
          onNodeDrag(event as MouseEvent, node);
        }

        updateNodePosDiff({
          id,
          diff: {
            x: draggableData.deltaX,
            y: draggableData.deltaY,
          },
          isDragging: true,
        });
      },
      [id, node, onNodeDrag]
    );

    const addField = useCallback((event: MouseEvent) => {
      let newNode = node
      /*
      const newNodeList = nodes?.map((n) => {
        if(n.id === node.id) {
          const randomName = makeid(8)
          newNode = {
            ...n,
            data: {
              ...n.data,
              fields: n?.data?.fields ? [...n?.data?.fields, { name: `field-${randomName}`, value: ''}] : [{ name: `field-${randomName}`, value: ''}]
            }
          }
          return newNode
        }
        return n
      })
      updateElements(newNodeList);
      */
      if(onAddField) {
        onAddField(event, newNode)
      }
    }, [onAddField, node])


    const removeField = useCallback((event: MouseEvent) => {
      if(onRemoveField) {
        onRemoveField(event, node)
      }
    }, [onRemoveField, node])


    const onDragStop = useCallback(
      (event: DraggableEvent) => {
        // onDragStop also gets called when user just clicks on a node.
        // Because of that we set dragging to true inside the onDrag handler and handle the click here
        if (!isDragging) {
          if (isSelectable && !selectNodesOnDrag && !selected) {
            addSelectedElements(node);
          }

          onClick?.(event as MouseEvent, node);

          return;
        }

        updateNodePosDiff({
          id: node.id,
          isDragging: false,
        });

        onNodeDragStop?.(event as MouseEvent, node);
      },
      [node, isSelectable, selectNodesOnDrag, onClick, onNodeDragStop, isDragging, selected]
    );

    useEffect(() => {
      if (nodeElement.current && !isHidden) {
        updateNodeDimensions([{ id, nodeElement: nodeElement.current }]);
      }
    }, [id, isHidden, sourcePosition, targetPosition]);

    const fieldRelationCount = React.useMemo(() => {
      let count = 0
 
      data?.fields?.forEach(({ type } : { type: string}) => {
        if(type === 'relation') count += 1
      });
      return count
    }, [data.fields])

    useEffect(() => {
      //On field type change force the handles to update
        if (nodeElement.current && !isHidden) {
          updateNodeDimensions([{ id, nodeElement: nodeElement.current, force: true }]);
      }
    }, [fieldRelationCount]);

    useEffect(() => {
      if (nodeElement.current) {
        const currNode = nodeElement.current;
        resizeObserver?.observe(currNode);

        return () => resizeObserver?.unobserve(currNode);
      }

      return;
    }, []);

    if (isHidden) {
      return null;
    }

    const nodeClasses = cc([
      'react-flow__node',
      `react-flow__node-${type}`,
      className,
      {
        selected,
        selectable: isSelectable,
      },
    ]);
    const handleFieldChange = useCallback((event: React.ChangeEvent) => {
      if(onFieldChange) {
        onFieldChange(event, node)
      }
    }, [onFieldChange, node])
    const handleTitleChange = useCallback((event: React.ChangeEvent) => {
      if(onTitleChange) {
        onTitleChange(event, node)
      }
    }, [onTitleChange, node])
    return (
      <DraggableCore
        onStart={onDragStart}
        onDrag={onDrag}
        onStop={onDragStop}
        scale={scale}
        disabled={!isDraggable}
        cancel=".nodrag"
        nodeRef={nodeElement}
        grid={grid}
      >
        <div
          className={nodeClasses}
          ref={nodeElement}
          style={nodeStyle}
          onMouseEnter={onMouseEnterHandler}
          onMouseMove={onMouseMoveHandler}
          onMouseLeave={onMouseLeaveHandler}
          onContextMenu={onContextMenuHandler}
          onClick={onSelectNodeHandler}
          data-id={id}
        >
          <Provider value={id}>
            <NodeComponent
              id={id}
              data={data}
              type={type}
              xPos={xPos}
              yPos={yPos}
              isValidConnection={isValidConnection}
              selected={selected}
              isConnectable={isConnectable}
              sourcePosition={sourcePosition}
              targetPosition={targetPosition}
              isDragging={isDragging}
              onAddField={addField}
              onTitleChange={handleTitleChange}
              onRemoveField={removeField}
              onFieldChange={handleFieldChange}
            />
          </Provider>
        </div>
      </DraggableCore>
    );
  };

  NodeWrapper.displayName = 'NodeWrapper';

  return memo(NodeWrapper);
};
