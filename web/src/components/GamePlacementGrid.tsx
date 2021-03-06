import { Box, Button, Flex, Grid } from '@chakra-ui/core'
import React, { FC, useEffect, useRef, useState } from 'react'
import { useGesture } from 'react-use-gesture'

const xy = Array.from(Array(10)).map(() => Array.from(Array(10)).map(() => false))

const defaultShipPosition: { [key: string]: { x: number; y: number; rotated: boolean } } = {
  carrier: { x: 0, y: 0, rotated: false },
  battleship: { x: 0, y: 1, rotated: false },
  destroyer: { x: 0, y: 2, rotated: false },
  submarine: { x: 0, y: 3, rotated: false },
  patrol: { x: 0, y: 4, rotated: false },
}

const shipLength: { [key: string]: number } = {
  carrier: 5,
  battleship: 4,
  destroyer: 3,
  submarine: 3,
  patrol: 2,
}

const GamePlacementGrid: FC<{
  onShipsPlaced: (positions: { [key: string]: [string] }, isOverlapping: boolean) => void
}> = ({ onShipsPlaced }) => {
  const gridRef = useRef()
  const lastShipDragged = useRef<string>('')
  const [shipPlacement, setShipPlacement] = useState<any>(defaultShipPosition)
  const [shipDragPosition, setShipDragPosition] = useState<any | undefined>()
  const [gridWidth, setGridWidth] = useState<number>(0)
  const [isOverlapping, setIsOverlapping] = useState<boolean>(false)

  const bind = useGesture({
    onDrag: ({ movement: [mx, my] }) => {
      handleDrag(mx, my)
    },
    onDragStart: ({ event }) => {
      handleDragStart(event!.target)
    },
    onDragEnd: ({ movement: [mx, my] }) => {
      handleDragEnd(mx, my)
    },
  })

  const handleDrag = (x: number, y: number) => {
    const currentShipPlacement = shipPlacement[lastShipDragged.current]
    const newX = Math.min(
      10 - (!currentShipPlacement.rotated ? shipLength[lastShipDragged.current] : 1),
      Math.max(0, currentShipPlacement.x + Math.floor(x / gridWidth))
    )
    const newY = Math.min(
      10 - (currentShipPlacement.rotated ? shipLength[lastShipDragged.current] : 1),
      Math.max(0, currentShipPlacement.y + Math.floor(y / gridWidth))
    )
    const newPosition = { ...currentShipPlacement, x: newX, y: newY }
    setShipDragPosition({ ...shipPlacement, [lastShipDragged.current]: newPosition })
  }

  const handleDragStart = (target: EventTarget) => {
    const domElement = target as HTMLElement
    lastShipDragged.current = domElement.dataset.ship || lastShipDragged.current
  }

  const handleDragEnd = (x: number, y: number) => {
    const currentShipPlacement = shipPlacement[lastShipDragged.current]
    const newX = Math.min(
      10 - (!currentShipPlacement.rotated ? shipLength[lastShipDragged.current] : 1),
      Math.max(0, currentShipPlacement.x + Math.floor(x / gridWidth))
    )
    const newY = Math.min(
      10 - (currentShipPlacement.rotated ? shipLength[lastShipDragged.current] : 1),
      Math.max(0, currentShipPlacement.y + Math.floor(y / gridWidth))
    )
    const newPosition = { ...currentShipPlacement, x: newX, y: newY }
    const newPlacement = { ...shipPlacement, [lastShipDragged.current]: newPosition }
    setShipPlacement(newPlacement)
    setShipDragPosition(undefined)

    const placementObject = Object.entries<{ x: number; y: number; rotated: boolean }>(newPlacement).reduce(
      (acc, [key, value]) => {
        return {
          ...acc,
          [key]: {
            positions: [...Array(shipLength[key])].map((_, index) =>
              value.rotated ? `x${value.x}y${value.y + index}` : `x${value.x + index}y${value.y}`
            ),
          },
        }
      },
      {}
    )

    const flatArray = Object.values<{ positions: [string] }>(placementObject)
      .map((p) => p.positions)
      .flat()
    const isOverlapping = new Set(flatArray).size !== flatArray.length
    onShipsPlaced(placementObject, isOverlapping)
  }

  useEffect(() => {
    const positions = Object.entries<{ x: number; y: number; rotated: boolean }>(shipPlacement).map(([key, value]) => {
      return [...Array(shipLength[key])].map((_, index) =>
        value.rotated ? `x${value.x}y${value.y + index}` : `x${value.x + index}y${value.y}`
      )
    })
    const placementObject = Object.entries<{ x: number; y: number; rotated: boolean }>(shipPlacement).reduce(
      (acc, [key, value]) => {
        return {
          ...acc,
          [key]: {
            positions: [...Array(shipLength[key])].map((_, index) =>
              value.rotated ? `x${value.x}y${value.y + index}` : `x${value.x + index}y${value.y}`
            ),
          },
        }
      },
      {}
    )
    const flatArray = positions.flat()
    const isOverlapping = new Set(flatArray).size !== flatArray.length
    setIsOverlapping(isOverlapping)
    onShipsPlaced(placementObject, isOverlapping)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipPlacement])

  useEffect(() => {
    const grid: HTMLElement = gridRef.current!
    const rect = grid.getBoundingClientRect()
    const width = (rect.width - 4) / 10
    setGridWidth(width)
  }, [])

  const calculateYPosition = (ship: string) => {
    if (shipDragPosition) {
      return `${shipDragPosition[ship].y * gridWidth}px`
    }
    return `${shipPlacement[ship].y * gridWidth}px`
  }

  const calculateXPosition = (ship: string) => {
    if (shipDragPosition) {
      return `${shipDragPosition[ship].x * gridWidth}px`
    }
    return `${shipPlacement[ship].x * gridWidth}px`
  }

  const rotateShip = (ship: string) => {
    const currentShip = shipPlacement[ship]
    const isRotated = currentShip.rotated

    if (isRotated) {
      const newX = Math.min(10 - shipLength[ship], currentShip.x)
      setShipPlacement({ ...shipPlacement, [ship]: { ...currentShip, x: newX, rotated: !isRotated } })
    } else {
      const newY = Math.min(10 - shipLength[ship], currentShip.y)
      setShipPlacement({ ...shipPlacement, [ship]: { ...currentShip, y: newY, rotated: !isRotated } })
    }
  }

  const widthForShip = (ship: string) => {
    if (shipPlacement[ship].rotated) {
      return `${gridWidth - 16}px`
    }
    return `${shipLength[ship] * gridWidth - 16}px`
  }

  const heightForShip = (ship: string) => {
    if (shipPlacement[ship].rotated) {
      return `${shipLength[ship] * gridWidth - 16}px`
    }
    return `${gridWidth - 16}px`
  }

  return (
    <>
      <Grid
        gridTemplateColumns="repeat(10, 1fr)"
        w="100%"
        maxW="550px"
        margin="0 auto"
        border="2px solid"
        borderColor="blue.500"
        pos="relative"
        ref={gridRef}
      >
        {xy.map((yArray, xIndex) => {
          return yArray.map((checked, yIndex) => (
            <Box
              key={`${xIndex}-${yIndex}`}
              outline="none"
              border="2px solid"
              borderColor="blue.500"
              w="100%"
              paddingTop="calc(100% - 4px)"
              bg="blue.700"
            ></Box>
          ))
        })}
        {Object.keys(shipPlacement).map((ship) => {
          return (
            <Box
              key={ship}
              style={{
                width: widthForShip(ship),
                height: heightForShip(ship),
                top: calculateYPosition(ship),
                left: calculateXPosition(ship),
                touchAction: 'none',
              }}
              borderRadius="full"
              transform="translate3d(8px, 8px, 0px)"
              bg="gray.400"
              border="4px solid"
              borderColor={lastShipDragged.current === ship ? 'gray.300' : 'transparent'}
              boxShadow={lastShipDragged.current === ship ? 'lg' : 'none'}
              zIndex={lastShipDragged.current === ship ? 2 : 1}
              opacity={0.95}
              pos="absolute"
              data-ship={ship}
              {...bind()}
            ></Box>
          )
        })}
      </Grid>
      <Flex pt={4} w="200px" margin="0 auto" flexDir="column">
        <Button
          variantColor="blue"
          isDisabled={!lastShipDragged.current}
          onClick={() => rotateShip(lastShipDragged.current)}
        >
          Rotate selected ship
        </Button>
        {isOverlapping ? 'Ships are overlapping' : 'Ships are well placed'}
      </Flex>
    </>
  )
}

export default GamePlacementGrid
