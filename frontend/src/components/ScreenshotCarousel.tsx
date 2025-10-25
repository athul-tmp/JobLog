// Reference: shadcn-ui
"use client"
import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { useTheme } from "@/hooks/useTheme"
import Image from 'next/image';

const IMAGES = [
    { 
        alt: "Dashboard Key Metrics",
        light: "/images/dashboard1-light.png",
        dark: "/images/dashboard1-dark.png",
        width: 1200, 
        height: 600, 
    },
    { 
        alt: "Dashboard Advanced Metrics",
        light: "/images/dashboard2-light.png",
        dark: "/images/dashboard2-dark.png",
        width: 1200, 
        height: 600,
    },
    { 
        alt: "Tracker Page Table View",
        light: "/images/tracker-light.png",
        dark: "/images/tracker-dark.png",
        width: 1200, 
        height: 600,
    },
];

export function ScreenshotCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  const theme = useTheme();

  return (
    <div className="relative w-full lg:ml-5 sm:overflow-visible overflow-hidden">
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {IMAGES.map((img, index) => (
          <CarouselItem key={index}>
            <div>
              <Card className="p-0 border-2 border-primary/40">
                <CardContent className="p-0">
                  <Image 
                      src={theme === "dark" ? img.dark : img.light}
                      alt={img.alt}
                      width={img.width}
                      height={img.height}
                      className="w-full h-auto rounded-xl"
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
    </div>
  )
}
