#import "FileViewerTurbo.h"

#import <QuickLook/QuickLook.h>
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "generated/RNFileViewerTurboSpec/RNFileViewerTurboSpec.h"
#endif

@interface File: NSObject<QLPreviewItem>

@property(readonly, nullable, nonatomic) NSURL *previewItemURL;
@property(readonly, nullable, nonatomic) NSString *previewItemTitle;

- (id)initWithPath:(NSString *)file title:(NSString *)title;

@end

@interface FileViewerTurbo ()<QLPreviewControllerDelegate>
@end

@implementation File

- (id)initWithPath:(NSString *)file title:(NSString *)title {
    if(self = [super init]) {
        _previewItemURL = [NSURL fileURLWithPath:file];
        _previewItemTitle = title;
    }
    return self;
}

@end

@interface CustomQLViewController: QLPreviewController<QLPreviewControllerDataSource>

@property(nonatomic, strong) File *file;
@property(nonatomic, strong) NSNumber *invocation;

@end

@implementation CustomQLViewController

- (instancetype)initWithFile:(File *)file identifier:(NSNumber *)invocation {
    if(self = [super init]) {
        _file = file;
        _invocation = invocation;
        self.dataSource = self;
    }
    return self;
}

- (BOOL)prefersStatusBarHidden {
    return UIApplication.sharedApplication.isStatusBarHidden;
}

- (NSInteger)numberOfPreviewItemsInPreviewController:(QLPreviewController *)controller{
    return 1;
}

- (id <QLPreviewItem>)previewController:(QLPreviewController *)controller previewItemAtIndex:(NSInteger)index{
    return self.file;
}

@end

@implementation FileViewerTurbo {
  bool hasListeners;
}

static RCTEventEmitter *staticEventEmitter = nil;
static NSNumber *invocationId = @33341;

-(void)startObserving {
    hasListeners = YES;
}

-(void)stopObserving {
    hasListeners = NO;
}

+ (BOOL)requiresMainQueueSetup {
    return NO;
}


- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

+ (UIViewController*)topViewController {
    UIViewController *presenterViewController = [self topViewControllerWithRootViewController:UIApplication.sharedApplication.keyWindow.rootViewController];
    return presenterViewController ? presenterViewController : UIApplication.sharedApplication.keyWindow.rootViewController;
}

+ (UIViewController*)topViewControllerWithRootViewController:(UIViewController*)viewController {
    if ([viewController isKindOfClass:[UITabBarController class]]) {
        UITabBarController* tabBarController = (UITabBarController*)viewController;
        return [self topViewControllerWithRootViewController:tabBarController.selectedViewController];
    }
    if ([viewController isKindOfClass:[UINavigationController class]]) {
        UINavigationController* navContObj = (UINavigationController*)viewController;
        return [self topViewControllerWithRootViewController:navContObj.visibleViewController];
    }
    if (viewController.presentedViewController && !viewController.presentedViewController.isBeingDismissed) {
        UIViewController* presentedViewController = viewController.presentedViewController;
        return [self topViewControllerWithRootViewController:presentedViewController];
    }
    for (UIView *view in [viewController.view subviews]) {
        id subViewController = [view nextResponder];
        if ( subViewController && [subViewController isKindOfClass:[UIViewController class]]) {
            if ([(UIViewController *)subViewController presentedViewController]  && ![subViewController presentedViewController].isBeingDismissed) {
                return [self topViewControllerWithRootViewController:[(UIViewController *)subViewController presentedViewController]];
            }
        }
    }
    return viewController;
}



- (void)sendEventWithName:(NSString * _Nonnull)name result:(NSDictionary<NSString *,NSString *> * _Nonnull)result {
    if (hasListeners) {
        [self sendEventWithName:name body:result];
    }
}


- (NSArray<NSString *> *)supportedEvents {
    return @[
        @"onViewerDidDismiss"
    ];
}


- (void)previewControllerDidDismiss:(CustomQLViewController *)controller {
  [self sendEventWithName:@"onViewerDidDismiss" body:nil];
}


- (void)dismissView:(id)sender {
    UIViewController* controller = [FileViewerTurbo topViewController];
//    [self sendEventWithName:@"onViewerDidDismiss" body:nil];
    [[FileViewerTurbo topViewController] dismissViewControllerAnimated:YES completion:nil];
}

RCT_EXPORT_MODULE(FileViewerTurbo)

RCT_EXPORT_METHOD(open:(NSString *)path
                  options:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {

      UIBarButtonItem *buttonItem;
      NSString *displayName = options[@"displayName"];
      NSString *doneButtonTitle = options[@"doneButtonTitle"];
      NSString *doneButtonPosition = options[@"doneButtonPosition"];

      File *file = [[File alloc] initWithPath:path title:displayName];

      QLPreviewController *controller = [[CustomQLViewController alloc] initWithFile:file identifier:invocationId];
      controller.delegate = self;

      if (@available(iOS 13.0, *)) {
          [controller setModalInPresentation: true];
      }

      UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController:controller];
    
      if (doneButtonTitle) {
        buttonItem = [[UIBarButtonItem alloc] initWithTitle:doneButtonTitle style:UIBarButtonItemStylePlain target:self action:@selector(dismissView:)];
      } else {
        buttonItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone target:self action:@selector(dismissView:)];
      }
  
      if ([doneButtonPosition isEqualToString: @"left"]) {
        controller.navigationItem.leftBarButtonItem = buttonItem;
      } else if ([doneButtonPosition isEqualToString: @"right"]) {
        controller.navigationItem.rightBarButtonItem = buttonItem;
      } else {
        controller.navigationItem.leftBarButtonItem = buttonItem;
      }

      if ([QLPreviewController canPreviewItem:file]) {
        [[FileViewerTurbo topViewController] presentViewController:navigationController animated:YES completion:^{
          resolve(nil);
        }];
      } else {
        reject(@"FileViewerTurbo:open", @"File not supported", nil);
      }
};

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeFileViewerTurboSpecJSI>(params);
}
#endif

@end
