import { env } from '@/config/env'
import { SiGithub } from '@icons-pack/react-simple-icons'

export const AppFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

          {/* 品牌区 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {env.appName}
            </h2>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              专注于深度阅读与信息过滤，助你摆脱信息焦虑，高效获取真正有价值的内容。
            </p>
          </div>

          {/* 快速链接 */}
          {/*<div className="flex flex-col gap-3">*/}
          {/*  <h3 className="text-xs font-medium text-foreground/70">产品</h3>*/}
          {/*  <nav className="flex flex-col gap-2 text-xs text-muted-foreground">*/}
          {/*    <a href="#" className="transition-colors hover:text-primary">使用指南</a>*/}
          {/*    <a href="#" className="transition-colors hover:text-primary">更新日志</a>*/}
          {/*    <a href="#" className="transition-colors hover:text-primary">隐私政策</a>*/}
          {/*  </nav>*/}
          {/*</div>*/}

          {/* 社交/联系区 */}
          <div className="flex flex-col gap-3 md:items-end">
            <h3 className="text-xs font-medium text-foreground/70">保持联系</h3>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a href="https://github.com/Voemp" className="transition-colors hover:text-foreground">
                <SiGithub className="h-4 w-4" />
              </a>
              {/*<a href={`mailto:support@example.com`} className="transition-colors hover:text-foreground">*/}
              {/*  <Mail className="h-4 w-4" />*/}
              {/*</a>*/}
            </div>
          </div>
        </div>

        {/* 底部版权栏 */}
        <div
          className="mt-10 border-t border-border/40 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            © {currentYear} {env.appName}. All rights reserved.
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Powered By Voemp
          </p>
        </div>
      </div>
    </footer>
  )
}