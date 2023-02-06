import * as React from "react";

type Setting = {
  skipCompileIfBuildExists: boolean;
};

type SettingContextType = {
  setting: Setting;
  setSetting: (setting: Setting) => void;
};

// create setting context
export const SettingContext = React.createContext<SettingContextType>({
  setting: {
    skipCompileIfBuildExists: false,
  },
  setSetting: () => {},
});

// create setting provider
export const SettingProvider: React.FC = ({ children }) => {
  const [setting, setSetting] = React.useState<Setting>({
    skipCompileIfBuildExists: false,
  });

  return (
    <SettingContext.Provider value={{ setting, setSetting }}>
      {children}
    </SettingContext.Provider>
  );
};