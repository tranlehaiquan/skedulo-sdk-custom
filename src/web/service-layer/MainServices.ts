/**
 * "Web" side services
 */
import { remote } from 'electron'

// NOTE: The path when doing a "remote-require" is from root of the project
import { Services } from '../../main/Services'
const MainServicesClass = remote.require('./main/Services').Services as (typeof Services)

export const MainServices = new MainServicesClass(remote.getCurrentWindow())
