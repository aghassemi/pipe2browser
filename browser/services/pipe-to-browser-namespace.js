// Copyright 2015 The Vanadium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/*
 * Implements a vanadium client that talks to the namespace service and finds all
 * the P2B services that are available.
 * @fileoverview
 */
import { Logger } from 'libs/logs/logger'
import vanadium from 'vanadium'

var log = new Logger('services/p2b-namespace');

/*
 * Finds all the P2B services that are published by querying the namespace.
 * @return {Promise} Promise resolving to an array of names for all published
 * P2B services
 */
export function getAll() {
  return vanadium.init().then((runtime) => {
    var namespace = runtime.getNamespace();
    var ctx = runtime.getContext().withTimeout(5000);
    ctx.waitUntilDone(function(){});

    var nsPrefix = runtime.accountName.replace('dev.v.io/u/', 'users/');
    var globPattern = vanadium.naming.join(nsPrefix, 'p2b/*');
    var globResult = namespace.glob(ctx, globPattern);
    var p2bServices = [];
    globResult.stream.on('data', (p2bServiceName) => {
      p2bServices.push(p2bServiceName.name);
    });

    // wait until all the data arrives then return the collection
    return globResult.then(() => {
      ctx.cancel();
      return p2bServices;
    });
  }).catch((err) => {
    if (err instanceof vanadium.verror.ExtensionNotInstalledError) {
      vanadium.extension.promptUserToInstallExtension();
    } else {
      throw err;
    }
  });
}
