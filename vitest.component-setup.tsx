import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
  NextIntlClientProvider: ({ children }: any) => children
}))

vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    className,
    variant,
    size,
    disabled,
    type,
    onClick,
    title
  }: any) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
      disabled={disabled}
      type={type || "button"}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}))

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input data-testid="input" {...props} />
}))

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea data-testid="textarea" {...props} />
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => (
    <label data-testid="label" htmlFor={htmlFor}>
      {children}
    </label>
  )
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <div data-testid="card-title" className={className}>
      {children}
    </div>
  ),
  CardDescription: ({ children, className }: any) => (
    <div data-testid="card-description" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardFooter: ({ children, className }: any) => (
    <div data-testid="card-footer" className={className}>
      {children}
    </div>
  ),
  CardAction: ({ children, className }: any) => (
    <div data-testid="card-action" className={className}>
      {children}
    </div>
  )
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className, variant }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  )
}))

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectGroup: ({ children }: any) => (
    <div data-testid="select-group">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectTrigger: ({ children, onClick }: any) => (
    <button data-testid="select-trigger" onClick={onClick}>
      {children}
    </button>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectLabel: ({ children }: any) => (
    <div data-testid="select-label">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectSeparator: () => <hr data-testid="select-separator" />
}))

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogTrigger: ({ children, asChild }: any) => (
    <div data-testid="dialog-trigger">{children}</div>
  ),
  DialogPortal: ({ children }: any) => (
    <div data-testid="dialog-portal">{children}</div>
  ),
  DialogClose: ({ children }: any) => (
    <button data-testid="dialog-close">{children}</button>
  ),
  DialogOverlay: ({ children }: any) => (
    <div data-testid="dialog-overlay">{children}</div>
  ),
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <div data-testid="dialog-title">{children}</div>
  ),
  DialogDescription: ({ children }: any) => (
    <div data-testid="dialog-description">{children}</div>
  )
}))

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: any) => <div data-testid="sheet">{children}</div>,
  SheetTrigger: ({ children }: any) => (
    <div data-testid="sheet-trigger">{children}</div>
  ),
  SheetClose: ({ children }: any) => (
    <button data-testid="sheet-close">{children}</button>
  ),
  SheetOverlay: ({ children }: any) => (
    <div data-testid="sheet-overlay">{children}</div>
  ),
  SheetContent: ({ children }: any) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: any) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetFooter: ({ children }: any) => (
    <div data-testid="sheet-footer">{children}</div>
  ),
  SheetTitle: ({ children }: any) => (
    <div data-testid="sheet-title">{children}</div>
  ),
  SheetDescription: ({ children }: any) => (
    <div data-testid="sheet-description">{children}</div>
  )
}))

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: any) => (
    <progress data-testid="progress" value={value} max={100} />
  )
}))

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: any) => (
    <div data-testid="tooltip-trigger">{children}</div>
  ),
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  )
}))

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div data-testid="popover">{children}</div>,
  PopoverTrigger: ({ children }: any) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
  PopoverAnchor: ({ children }: any) => (
    <div data-testid="popover-anchor">{children}</div>
  )
}))

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  )
}))

vi.mock("@/components/ui/separator", () => ({
  Separator: ({ orientation }: any) => (
    <hr data-testid="separator" data-orientation={orientation} />
  )
}))

vi.mock("@/components/ui/toggle", () => ({
  Toggle: ({ children, onClick, pressed }: any) => (
    <button data-testid="toggle" data-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}))

vi.mock("@/components/ui/spinner", () => ({
  Spinner: ({ size }: any) => (
    <svg data-testid="spinner" className={`spinner-${size}`} />
  )
}))

vi.mock("@/components/ui/empty", () => ({
  Empty: ({ title, description }: any) => (
    <div
      data-testid="empty"
      data-title={title}
      data-description={description}
    />
  )
}))

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />
}))

vi.mock("@/components/ui/markdown-modal", () => ({
  MarkdownModal: ({ title, content, open, onClose }: any) =>
    open ? (
      <div data-testid="markdown-modal" data-title={title}>
        {content}
      </div>
    ) : null
}))

vi.mock("@/components/ui/empty-state", () => ({
  EmptyState: ({ icon, title, description, action }: any) => (
    <div data-testid="empty-state">
      <span data-testid="empty-state-icon">{icon}</span>
      <span data-testid="empty-state-title">{title}</span>
      <span data-testid="empty-state-description">{description}</span>
      <div data-testid="empty-state-action">{action}</div>
    </div>
  )
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => (
    <div data-testid="scroll-area">{children}</div>
  )
}))

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      data-testid="switch"
      checked={checked}
      onChange={() => onCheckedChange?.(!checked)}
    />
  )
}))

vi.mock("@/components/ui/radio-group", () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div data-testid="radio-group" data-value={value}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <input
      type="radio"
      data-testid="radio-group-item"
      data-value={value}
      id={id}
    />
  )
}))

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: any) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
  SidebarHeader: ({ children }: any) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarFooter: ({ children }: any) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  SidebarContent: ({ children }: any) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarGroup: ({ children }: any) => (
    <div data-testid="sidebar-group">{children}</div>
  ),
  SidebarGroupContent: ({ children }: any) => (
    <div data-testid="sidebar-group-content">{children}</div>
  ),
  SidebarMenu: ({ children }: any) => (
    <ul data-testid="sidebar-menu">{children}</ul>
  ),
  SidebarMenuItem: ({ children }: any) => (
    <li data-testid="sidebar-menu-item">{children}</li>
  ),
  SidebarMenuButton: ({
    children,
    onClick,
    className,
    "data-testid": testId
  }: any) => (
    <button
      data-testid={testId || "sidebar-menu-button"}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  ),
  useSidebar: () => ({
    state: "collapsed",
    isMobile: false,
    toggleSidebar: () => {}
  })
}))

vi.mock("lucide-react", () => ({
  Check: () => <svg data-testid="check-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
  X: () => <svg data-testid="x-icon" />,
  XCircle: () => <svg data-testid="x-circle-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
  AlertTriangle: () => <svg data-testid="alert-triangle-icon" />,
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  ArrowLeft: () => <svg data-testid="arrow-left-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  Minus: () => <svg data-testid="minus-icon" />,
  Loader2: () => <svg data-testid="loader-2-icon" />,
  Loader: () => <svg data-testid="loader-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  User: () => <svg data-testid="user-icon" />,
  LogOut: () => <svg data-testid="logout-icon" />,
  Moon: () => <svg data-testid="moon-icon" />,
  Sun: () => <svg data-testid="sun-icon" />,
  Menu: () => <svg data-testid="menu-icon" />,
  Crown: () => <svg data-testid="crown-icon" />,
  Trophy: () => <svg data-testid="trophy-icon" />,
  CreditCard: () => <svg data-testid="credit-card-icon" />,
  RefreshCw: () => <svg data-testid="refresh-cw-icon" />,
  ArrowUpRight: () => <svg data-testid="arrow-up-right-icon" />,
  Info: () => <svg data-testid="info-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  CheckCircle2: () => <svg data-testid="check-circle-2-icon" />,
  Circle: () => <svg data-testid="circle-icon" />,
  Zap: () => <svg data-testid="zap-icon" />,
  Sparkles: () => <svg data-testid="sparkles-icon" />,
  Briefcase: () => <svg data-testid="briefcase-icon" />,
  Building: () => <svg data-testid="building-icon" />,
  MapPin: () => <svg data-testid="map-pin-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  Phone: () => <svg data-testid="phone-icon" />,
  Globe: () => <svg data-testid="globe-icon" />,
  Link: () => <svg data-testid="link-icon" />,
  Share: () => <svg data-testid="share-icon" />,
  MessageSquare: () => <svg data-testid="message-square-icon" />,
  Heart: () => <svg data-testid="heart-icon" />,
  Star: () => <svg data-testid="star-icon" />,
  Flag: () => <svg data-testid="flag-icon" />,
  TrendingUp: () => <svg data-testid="trending-up-icon" />,
  TrendingDown: () => <svg data-testid="trending-down-icon" />,
  BarChart: () => <svg data-testid="bar-chart-icon" />,
  PieChart: () => <svg data-testid="pie-chart-icon" />,
  Activity: () => <svg data-testid="activity-icon" />,
  Target: () => <svg data-testid="target-icon" />,
  Award: () => <svg data-testid="award-icon" />,
  Gift: () => <svg data-testid="gift-icon" />,
  ShoppingCart: () => <svg data-testid="shopping-cart-icon" />,
  Package: () => <svg data-testid="package-icon" />,
  Truck: () => <svg data-testid="truck-icon" />,
  Filter: () => <svg data-testid="filter-icon" />,
  SortAsc: () => <svg data-testid="sort-asc-icon" />,
  SortDesc: () => <svg data-testid="sort-desc-icon" />,
  Grid: () => <svg data-testid="grid-icon" />,
  List: () => <svg data-testid="list-icon" />,
  Maximize: () => <svg data-testid="maximize-icon" />,
  Minimize: () => <svg data-testid="minimize-icon" />,
  ZoomIn: () => <svg data-testid="zoom-in-icon" />,
  ZoomOut: () => <svg data-testid="zoom-out-icon" />,
  RotateCcw: () => <svg data-testid="rotate-ccw-icon" />,
  RotateCw: () => <svg data-testid="rotate-cw-icon" />,
  Undo: () => <svg data-testid="undo-icon" />,
  Redo: () => <svg data-testid="redo-icon" />,
  Save: () => <svg data-testid="save-icon" />,
  Folder: () => <svg data-testid="folder-icon" />,
  FolderOpen: () => <svg data-testid="folder-open-icon" />,
  File: () => <svg data-testid="file-icon" />,
  FilePlus: () => <svg data-testid="file-plus-icon" />,
  FileMinus: () => <svg data-testid="file-minus-icon" />,
  FolderPlus: () => <svg data-testid="folder-plus-icon" />,
  FolderMinus: () => <svg data-testid="folder-minus-icon" />,
  CornerUpLeft: () => <svg data-testid="corner-up-left-icon" />,
  CornerUpRight: () => <svg data-testid="corner-up-right-icon" />,
  CornerDownLeft: () => <svg data-testid="corner-down-left-icon" />,
  CornerDownRight: () => <svg data-testid="corner-down-right-icon" />,
  Play: () => <svg data-testid="play-icon" />,
  Pause: () => <svg data-testid="pause-icon" />,
  Stop: () => <svg data-testid="stop-icon" />,
  SkipBack: () => <svg data-testid="skip-back-icon" />,
  SkipForward: () => <svg data-testid="skip-forward-icon" />,
  Volume2: () => <svg data-testid="volume-2-icon" />,
  VolumeX: () => <svg data-testid="volume-x-icon" />,
  Volume1: () => <svg data-testid="volume-1-icon" />,
  Keyboard: () => <svg data-testid="keyboard-icon" />,
  Tablet: () => <svg data-testid="tablet-icon" />,
  Smartphone: () => <svg data-testid="smartphone-icon" />,
  Monitor: () => <svg data-testid="monitor-icon" />,
  Cloud: () => <svg data-testid="cloud-icon" />,
  CloudDrizzle: () => <svg data-testid="cloud-drizzle-icon" />,
  CloudRain: () => <svg data-testid="cloud-rain-icon" />,
  CloudSnow: () => <svg data-testid="cloud-snow-icon" />,
  CloudLightning: () => <svg data-testid="cloud-lightning-icon" />,
  CloudOff: () => <svg data-testid="cloud-off-icon" />,
  Thermometer: () => <svg data-testid="thermometer-icon" />,
  Droplet: () => <svg data-testid="droplet-icon" />,
  Wind: () => <svg data-testid="wind-icon" />,
  Feather: () => <svg data-testid="feather-icon" />,
  Anchor: () => <svg data-testid="anchor-icon" />,
  Compass: () => <svg data-testid="compass-icon" />,
  Map: () => <svg data-testid="map-icon" />,
  Navigation: () => <svg data-testid="navigation-icon" />,
  Aperture: () => <svg data-testid="aperture-icon" />,
  Crosshair: () => <svg data-testid="crosshair-icon" />,
  Disc: () => <svg data-testid="disc-icon" />,
  Layers: () => <svg data-testid="layers-icon" />,
  Overlay: () => <svg data-testid="overlay-icon" />,
  PanTool: () => <svg data-testid="pan-tool-icon" />,
  Pipette: () => <svg data-testid="pipette-icon" />,
  Box: () => <svg data-testid="box-icon" />,
  Archive: () => <svg data-testid="archive-icon" />,
  Inbox: () => <svg data-testid="inbox-icon" />,
  Send: () => <svg data-testid="send-icon" />,
  Paperclip: () => <svg data-testid="paperclip-icon" />,
  Quote: () => <svg data-testid="quote-icon" />,
  Code: () => <svg data-testid="code-icon" />,
  GitBranch: () => <svg data-testid="git-branch-icon" />,
  GitCommit: () => <svg data-testid="git-commit-icon" />,
  GitMerge: () => <svg data-testid="git-merge-icon" />,
  GitPullRequest: () => <svg data-testid="git-pull-request-icon" />,
  Terminal: () => <svg data-testid="terminal-icon" />,
  Code2: () => <svg data-testid="code-2-icon" />,
  Database: () => <svg data-testid="database-icon" />,
  Server: () => <svg data-testid="server-icon" />,
  HardDrive: () => <svg data-testid="hard-drive-icon" />,
  Cpu: () => <svg data-testid="cpu-icon" />,
  Memory: () => <svg data-testid="memory-icon" />,
  Wifi: () => <svg data-testid="wifi-icon" />,
  WifiOff: () => <svg data-testid="wifi-off-icon" />,
  Mic: () => <svg data-testid="mic-icon" />,
  MicOff: () => <svg data-testid="mic-off-icon" />,
  Video: () => <svg data-testid="video-icon" />,
  VideoOff: () => <svg data-testid="video-off-icon" />,
  Image: () => <svg data-testid="image-icon" />,
  Camera: () => <svg data-testid="camera-icon" />,
  ImagePlus: () => <svg data-testid="image-plus-icon" />,
  Images: () => <svg data-testid="images-icon" />,
  Microscope: () => <svg data-testid="microscope-icon" />,
  Telescope: () => <svg data-testid="telescope-icon" />,
  Binoculars: () => <svg data-testid="binoculars-icon" />,
  Table: () => <svg data-testid="table-icon" />,
  Columns: () => <svg data-testid="columns-icon" />,
  Rows: () => <svg data-testid="rows-icon" />,
  Clapperboard: () => <svg data-testid="clapperboard-icon" />,
  Concert: () => <svg data-testid="concert-icon" />,
  Guitar: () => <svg data-testid="guitar-icon" />,
  Piano: () => <svg data-testid="piano-icon" />,
  Music: () => <svg data-testid="music-icon" />,
  Radio: () => <svg data-testid="radio-icon" />,
  Library: () => <svg data-testid="library-icon" />,
  Repeat: () => <svg data-testid="repeat-icon" />,
  Repeat1: () => <svg data-testid="repeat-1-icon" />,
  Shuffle: () => <svg data-testid="shuffle-icon" />,
  CirclePlay: () => <svg data-testid="circle-play-icon" />,
  CirclePause: () => <svg data-testid="circle-pause-icon" />,
  CircleStop: () => <svg data-testid="circle-stop-icon" />,
  CirclePlus: () => <svg data-testid="circle-plus-icon" />,
  CircleMinus: () => <svg data-testid="circle-minus-icon" />,
  CircleX: () => <svg data-testid="circle-x-icon" />,
  CircleCheck: () => <svg data-testid="circle-check-icon" />,
  CircleDashed: () => <svg data-testid="circle-dashed-icon" />,
  Asterisk: () => <svg data-testid="asterisk-icon" />,
  AtSign: () => <svg data-testid="at-sign-icon" />,
  Hash: () => <svg data-testid="hash-icon" />,
  Copyright: () => <svg data-testid="copyright-icon" />,
  Registered: () => <svg data-testid="registered-icon" />,
  Trademark: () => <svg data-testid="trademark-icon" />,
  Scissors: () => <svg data-testid="scissors-icon" />,
  Clipboard: () => <svg data-testid="clipboard-icon" />,
  ClipboardCopy: () => <svg data-testid="clipboard-copy-icon" />,
  ClipboardList: () => <svg data-testid="clipboard-list-icon" />,
  ClipboardCheck: () => <svg data-testid="clipboard-check-icon" />,
  Bat: () => <svg data-testid="bat-icon" />,
  MoonStar: () => <svg data-testid="moon-star-icon" />,
  SunMedium: () => <svg data-testid="sun-medium-icon" />,
  MoonMedium: () => <svg data-testid="moon-medium-icon" />,
  Sunrise: () => <svg data-testid="sunrise-icon" />,
  Sunset: () => <svg data-testid="sunset-icon" />,
  ChevronsDown: () => <svg data-testid="chevrons-down-icon" />,
  ChevronsUp: () => <svg data-testid="chevrons-up-icon" />,
  ChevronsLeft: () => <svg data-testid="chevrons-left-icon" />,
  ChevronsRight: () => <svg data-testid="chevrons-right-icon" />,
  TwemojiWavingHand: () => <svg data-testid="twemoji-waving-hand-icon" />,
  TwemojiRaisingHands: () => <svg data-testid="twemoji-raising-hands-icon" />,
  TwemojiClappingHands: () => <svg data-testid="twemoji-clapping-hands-icon" />,
  TwemojiLoveYou: () => <svg data-testid="twemoji-love-you-icon" />,
  TwemojiHugging: () => <svg data-testid="twemoji-hugging-icon" />,
  TwemojiShrug: () => <svg data-testid="twemoji-shrug-icon" />,
  TwemojiThinking: () => <svg data-testid="twemoji-thinking-icon" />,
  TwemojiHeartEyes: () => <svg data-testid="twemoji-heart-eyes-icon" />,
  TwemojiStarStrike: () => <svg data-testid="twemoji-star-strike-icon" />,
  TwemojiFire: () => <svg data-testid="twemoji-fire-icon" />,
  Twemoji100: () => <svg data-testid="twemoji-100-icon" />,
  TwemojiWin: () => <svg data-testid="twemoji-win-icon" />,
  TwemojiCongratulation: () => (
    <svg data-testid="twemoji-congratulation-icon" />
  ),
  TwemojiMedal: () => <svg data-testid="twemoji-medal-icon" />,
  ResumeIcon: () => <svg data-testid="resume-icon" />,
  JobiLogo: () => <svg data-testid="jobi-logo-icon" />,
  CopyIcon: () => <svg data-testid="copy-icon-2" />,
  DownloadIcon: () => <svg data-testid="download-icon-2" />,
  FileTextIcon: () => <svg data-testid="file-text-icon-2" />,
  FormInput: () => <svg data-testid="form-input-icon" />,
  ScanBarcode: () => <svg data-testid="scan-barcode-icon" />,
  ScanEye: () => <svg data-testid="scan-eye-icon" />,
  LayoutDashboard: () => <svg data-testid="layout-dashboard-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  Eye: () => <svg data-testid="eye-icon" />,
  Wand2: () => <svg data-testid="wand-2-icon" />,
  ExternalLink: () => <svg data-testid="external-link-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  PanelLeft: () => <svg data-testid="panel-left-icon" />,
  PanelRight: () => <svg data-testid="panel-right-icon" />,
  LogIn: () => <svg data-testid="log-in-icon" />,
  UserPlus: () => <svg data-testid="user-plus-icon" />,
  MoreHorizontal: () => <svg data-testid="more-horizontal-icon" />,
  MoreVertical: () => <svg data-testid="more-vertical-icon" />,
  Search: () => <svg data-testid="search-icon" />,
  Bell: () => <svg data-testid="bell-icon" />,
  HelpCircle: () => <svg data-testid="help-circle-icon" />,
  AlertOctagon: () => <svg data-testid="alert-octagon-icon" />,
  Ban: () => <svg data-testid="ban-icon" />,
  Trash: () => <svg data-testid="trash-icon" />,
  Edit: () => <svg data-testid="edit-icon" />,
  Copy: () => <svg data-testid="copy-icon" />,
  CheckSquare: () => <svg data-testid="check-square-icon" />,
  Layout: () => <svg data-testid="layout-icon" />,
  Sidebar: () => <svg data-testid="sidebar-icon" />
}))
