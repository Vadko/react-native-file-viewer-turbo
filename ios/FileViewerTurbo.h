#ifdef RCT_NEW_ARCH_ENABLED
#import "generated/RNFileViewerTurboSpec/RNFileViewerTurboSpec.h"

@interface FileViewerTurbo : NativeFileViewerTurboSpecBase <NativeFileViewerTurboSpec>

#else
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface FileViewerTurbo: RCTEventEmitter <RCTBridgeModule, NSURLSessionTaskDelegate>
#endif

+ (UIViewController*)topViewController;
+ (UIViewController*)topViewControllerWithRootViewController:(UIViewController*)viewController;

@end
