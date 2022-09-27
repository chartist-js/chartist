import { ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useThemeContext from '@theme/hooks/useThemeContext';

interface IContext {
  branch: string;
  theme: 'light' | 'dark';
}

export default function ContextProvider({
  children,
}: {
  children(context: IContext): ReactNode;
}) {
  const ctx = useDocusaurusContext();
  const { isDarkTheme } = useThemeContext();
  const context = {
    branch: ctx.siteConfig.customFields.branch as string,
    theme: isDarkTheme ? ('dark' as const) : ('light' as const),
  };

  return children(context);
}
