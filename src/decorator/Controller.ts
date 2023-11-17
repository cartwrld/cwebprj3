export const Controller = (path = ''): ClassDecorator => {
  return (target: any) => {
    Reflect.defineMetadata('path', path, target)

    // Since routes are set by our methods this should almost never be true (except the controller has no methods)
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target)
    }
  }
}
