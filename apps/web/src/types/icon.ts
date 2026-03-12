import type { LucideIcon } from 'lucide-react'
import * as React from 'react'

export type IconType = LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: string | number }>