#import <RNFileViewerTurboSpec/RNFileViewerTurboSpec.h>

@interface FileViewerTurbo : NativeFileViewerTurboSpecBase <NativeFileViewerTurboSpec>

+ (UIViewController*)topViewController;
+ (UIViewController*)topViewControllerWithRootViewController:(UIViewController*)viewController;

@end
