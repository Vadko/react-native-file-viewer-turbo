#import "FileViewerTurbo.h"

#import <QuickLook/QuickLook.h>
#import <React/RCTUtils.h>

@interface RNFVTPreviewItem : NSObject <QLPreviewItem>

@property (readonly, nullable, nonatomic) NSURL *previewItemURL;
@property (readonly, nullable, nonatomic) NSString *previewItemTitle;

- (instancetype)initWithPath:(NSString *)path title:(nullable NSString *)title;

@end

@implementation RNFVTPreviewItem

- (instancetype)initWithPath:(NSString *)path title:(NSString *)title
{
  if (self = [super init]) {
    _previewItemURL = [NSURL fileURLWithPath:path];
    _previewItemTitle = title;
  }
  return self;
}

@end

@interface RNFVTPreviewController : QLPreviewController <QLPreviewControllerDataSource>

@property (nonatomic, strong) RNFVTPreviewItem *item;

- (instancetype)initWithItem:(RNFVTPreviewItem *)item;

@end

@implementation RNFVTPreviewController

- (instancetype)initWithItem:(RNFVTPreviewItem *)item
{
  if (self = [super init]) {
    _item = item;
    self.dataSource = self;
  }
  return self;
}

- (BOOL)prefersStatusBarHidden
{
  UIStatusBarManager *statusBarManager = self.viewIfLoaded.window.windowScene.statusBarManager;
  if (statusBarManager == nil) {
    statusBarManager = RCTUIStatusBarManager();
  }
  return statusBarManager.isStatusBarHidden;
}

- (NSInteger)numberOfPreviewItemsInPreviewController:(QLPreviewController *)controller
{
  return 1;
}

- (id<QLPreviewItem>)previewController:(QLPreviewController *)controller previewItemAtIndex:(NSInteger)index
{
  return self.item;
}

- (void)rnfvt_dismiss:(id)sender
{
  [self dismissViewControllerAnimated:YES completion:nil];
}

@end

@interface FileViewerTurbo () <QLPreviewControllerDelegate>
@end

@implementation FileViewerTurbo

// Replaces RCT_EXPORT_MODULE. The class name must stay equal to the module name:
// RCTTurboModuleManager uses codegenConfig.ios.modulesProvider on RN >= 0.79 and
// falls back to NSClassFromString(moduleName) otherwise.
+ (NSString *)moduleName
{
  return @"FileViewerTurbo";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)previewControllerDidDismiss:(QLPreviewController *)controller
{
  [self emitOnViewerDidDismiss];
}

- (void)open:(NSString *)path
     options:(JS::NativeFileViewerTurbo::Options &)options
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  NSString *displayName = options.displayName();
  NSString *doneButtonTitle = options.doneButtonTitle();
  NSString *doneButtonPosition = options.doneButtonPosition();

  RNFVTPreviewItem *item = [[RNFVTPreviewItem alloc] initWithPath:path title:displayName];
  if (![QLPreviewController canPreviewItem:item]) {
    reject(@"FileViewerTurbo:open", @"File not supported", nil);
    return;
  }

  UIViewController *presenter = RCTPresentedViewController();
  if (presenter == nil) {
    reject(@"FileViewerTurbo:open", @"No view controller available to present the file viewer", nil);
    return;
  }
  if (presenter.presentedViewController != nil || presenter.isBeingPresented || presenter.viewIfLoaded.window == nil) {
    reject(@"FileViewerTurbo:open", @"Another transition is in progress, try again once it has finished", nil);
    return;
  }

  RNFVTPreviewController *controller = [[RNFVTPreviewController alloc] initWithItem:item];
  controller.delegate = self;

  UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController:controller];
  navigationController.modalInPresentation = YES;

  UIBarButtonItem *buttonItem = doneButtonTitle
      ? [[UIBarButtonItem alloc] initWithTitle:doneButtonTitle
                                         style:UIBarButtonItemStylePlain
                                        target:controller
                                        action:@selector(rnfvt_dismiss:)]
      : [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                                                      target:controller
                                                      action:@selector(rnfvt_dismiss:)];

  if ([doneButtonPosition isEqualToString:@"right"]) {
    controller.navigationItem.rightBarButtonItem = buttonItem;
  } else {
    controller.navigationItem.leftBarButtonItem = buttonItem;
  }

  [presenter presentViewController:navigationController
                          animated:YES
                        completion:^{
                          resolve(nil);
                        }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeFileViewerTurboSpecJSI>(params);
}

@end
