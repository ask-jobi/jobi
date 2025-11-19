"use client"
import {Separator} from "@radix-ui/react-separator";
import {ArrowLeft} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useRouter, useSelectedLayoutSegment} from "next/navigation";
import * as React from "react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {useEffect, useState} from "react";
import {useResume} from "@/lib/store/resume";

type NavigationLink = {
  href: string,
  label: string,
  active: boolean
}

const defaultNavigationLinks: NavigationLink[] = [
  { href: 'resume', label: 'Resume', active: true },
  { href: 'jd', label: 'Job Description', active: false }
];

export default ({
                  children,
                }: {
  children: React.ReactNode;
}) => {
  const router = useRouter()
  const segment = useSelectedLayoutSegment();
  const [navigationLinks, setNavigationLinks] = useState(defaultNavigationLinks)

  const handleGoBack = () => {
    router.replace(`/dashboard`)
  }

  useEffect(() => {
    setNavigationLinks(navigationLinks =>
      navigationLinks
        .map(it => {
          it.active = segment === it.href;
          return it
        })
    )
  }, [segment]);

  return (
    <div className="w-full">
      <header
        className="header group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <Button
            variant="ghost"
            onClick={handleGoBack}>
            <ArrowLeft/>
          </Button>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <NavigationMenu className="flex">
            <NavigationMenuList className="gap-1">
              {navigationLinks.map((link, index) => (
                <NavigationMenuItem key={index}>
                  <NavigationMenuLink
                    onClick={() => {
                      router.push(`${link.href}`)
                    }}
                    className={cn(
                      'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer relative',
                      'before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:bg-primary before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100',
                      link.active && 'before:scale-x-100 text-primary'
                    )}
                    data-active={link.active}
                  >
                    {link.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>
      {children}
    </div>
  )
}
