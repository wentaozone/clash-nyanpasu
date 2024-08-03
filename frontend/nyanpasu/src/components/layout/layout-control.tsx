import { useMemoizedFn } from "ahooks";
import { debounce } from "lodash-es";
import { useEffect, useState } from "react";
import { classNames } from "@/utils";
import { notification, NotificationType } from "@/utils/notification";
import {
  CloseRounded,
  CropSquareRounded,
  FilterNoneRounded,
  HorizontalRuleRounded,
  PushPin,
  PushPinOutlined,
} from "@mui/icons-material";
import { alpha, Button, ButtonProps, useTheme } from "@mui/material";
import { save_window_size_state, useNyanpasu } from "@nyanpasu/interface";
import { platform, type Platform } from "@tauri-apps/api/os";
import { appWindow } from "@tauri-apps/api/window";

const CtrlButton = (props: ButtonProps) => {
  const { palette } = useTheme();

  return (
    <Button
      className="!size-8 !min-w-0"
      sx={{
        backgroundColor: alpha(palette.primary.main, 0.1),
        svg: { transform: "scale(0.9)" },
      }}
      {...props}
    />
  );
};

export const LayoutControl = ({ className }: { className?: string }) => {
  const { nyanpasuConfig, setNyanpasuConfig } = useNyanpasu();
  const [isMaximized, setIsMaximized] = useState(false);

  const [platfrom, setPlatform] = useState<Platform>("win32");

  const updateMaximized = async () => {
    try {
      const isMaximized = await appWindow.isMaximized();
      setIsMaximized(() => isMaximized);
    } catch (error) {
      notification({
        type: NotificationType.Error,
        title: "Error",
        body: typeof error === "string" ? error : (error as Error).message,
      });
    }
  };

  const toggleAlwaysOnTop = useMemoizedFn(async () => {
    const isAlwaysOnTop = !!nyanpasuConfig?.always_on_top;
    await setNyanpasuConfig({ always_on_top: !isAlwaysOnTop });
    await appWindow.setAlwaysOnTop(!isAlwaysOnTop);
  });

  useEffect(() => {
    // Update the maximized state
    updateMaximized();

    // Get the platform
    platform().then((platform) => {
      setPlatform(() => platform);
    });

    // Add a resize handler to update the maximized state
    const resizeHandler = debounce(updateMaximized, 1000);

    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <div className={classNames("flex gap-1", className)} data-tauri-drag-region>
      <CtrlButton onClick={toggleAlwaysOnTop}>
        {nyanpasuConfig?.always_on_top ? (
          <PushPin fontSize="small" style={{ transform: "rotate(15deg)" }} />
        ) : (
          <PushPinOutlined
            fontSize="small"
            style={{ transform: "rotate(15deg)" }}
          />
        )}
      </CtrlButton>

      <CtrlButton onClick={() => appWindow.minimize()}>
        <HorizontalRuleRounded fontSize="small" />
      </CtrlButton>

      <CtrlButton
        onClick={() => {
          setIsMaximized((isMaximized) => !isMaximized);
          appWindow.toggleMaximize();
        }}
      >
        {isMaximized ? (
          <FilterNoneRounded
            fontSize="small"
            style={{
              transform: "rotate(180deg) scale(0.8)",
            }}
          />
        ) : (
          <CropSquareRounded fontSize="small" />
        )}
      </CtrlButton>

      <CtrlButton
        onClick={() => {
          if (platfrom === "win32") {
            save_window_size_state().finally(() => {
              appWindow.close();
            });
          } else {
            appWindow.close();
          }
        }}
      >
        <CloseRounded fontSize="small" />
      </CtrlButton>
    </div>
  );
};
