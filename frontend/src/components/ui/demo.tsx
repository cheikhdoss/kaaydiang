"use client"

import { DynamicFrameLayout } from "@/components/ui/dynamic-frame-layout"

const cornerImage = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=256&h=256&fit=crop&q=80"
const horizontalEdgeImage = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=128&fit=crop&q=80"
const verticalEdgeImage = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=1200&fit=crop&q=80"

const demoFrames = [
  {
    id: 1,
    media: "https://static.cdn-luma.com/files/981e483f71aa764b/Company%20Thing%20Exported.mp4",
    defaultPos: { x: 0, y: 0, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
  {
    id: 2,
    media: "https://static.cdn-luma.com/files/58ab7363888153e3/WebGL%20Exported%20(1).mp4",
    defaultPos: { x: 4, y: 0, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
  {
    id: 3,
    media: "https://static.cdn-luma.com/files/58ab7363888153e3/Jitter%20Exported%20Poster.mp4",
    defaultPos: { x: 8, y: 0, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
  {
    id: 4,
    media: "https://static.cdn-luma.com/files/58ab7363888153e3/Exported%20Web%20Video.mp4",
    defaultPos: { x: 0, y: 4, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
  {
    id: 5,
    media: "https://static.cdn-luma.com/files/58ab7363888153e3/Logo%20Exported.mp4",
    defaultPos: { x: 4, y: 4, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
  {
    id: 6,
    media: "https://static.cdn-luma.com/files/58ab7363888153e3/Animation%20Exported%20(4).mp4",
    defaultPos: { x: 8, y: 4, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
  {
    id: 7,
    media: "https://static.cdn-luma.com/files/58ab7363888153e3/Illustration%20Exported%20(1).mp4",
    defaultPos: { x: 0, y: 8, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
  {
    id: 8,
    media: "https://static.cdn-luma.com/files/58ab7363888153e3/Art%20Direction%20Exported.mp4",
    defaultPos: { x: 4, y: 8, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
  {
    id: 9,
    media: "https://static.cdn-luma.com/files/58ab7363888153e3/Product%20Video.mp4",
    defaultPos: { x: 8, y: 8, w: 4, h: 4 },
    corner: cornerImage,
    edgeHorizontal: horizontalEdgeImage,
    edgeVertical: verticalEdgeImage,
    mediaSize: 1,
    borderThickness: 6,
    borderSize: 88,
    isHovered: false,
  },
]

export function DemoPage() {
  return (
    <div className="h-screen w-screen bg-zinc-900">
      <DynamicFrameLayout
        frames={demoFrames}
        className="w-full h-full"
        hoverSize={6}
        gapSize={4}
      />
    </div>
  )
}
