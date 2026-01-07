#import <RNFileViewerTurboSpec/RNFileViewerTurboSpec.h>

@interface FileViewerTurbo : NativeFileViewerTurboSpecBase <NativeFileViewerTurboSpec>

+ (UIWindow*)keyWindow;
+ (UIViewController*)topViewController;
+ (UIViewController*)topViewControllerWithRootViewController:(UIViewController*)viewController;

@end
