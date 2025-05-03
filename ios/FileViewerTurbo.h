#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "generated/RNFileViewerTurboSpec/RNFileViewerTurboSpec.h"

@interface FileViewerTurbo : RCTEventEmitter <NativeFileViewerTurboSpec>

#else
#import <React/RCTBridgeModule.h>

@interface FileViewerTurbo: RCTEventEmitter <RCTBridgeModule, NSURLSessionTaskDelegate>
#endif

+ (UIViewController*)topViewController;
+ (UIViewController*)topViewControllerWithRootViewController:(UIViewController*)viewController;

@end
