import { Avatar } from './avatar'
import { Info } from './github'
import { HamburgerButton } from './hamburger'
import { HomeButton } from './home'
import './light.scss'
import './main.scss'
import { Notifications } from './notifications'
import { QuickAddTask } from './quick-add-task'
import { AddChecklist } from './add-checklist'
export const Header = (props) => {
  return (
    <div className='header'>
      <div className='header__left'>
        <HamburgerButton onClick={props.onClick} />
        <HomeButton />
      </div>
      <div className='header__right'>
        <AddChecklist />
        <QuickAddTask />
        <Info />
        <Notifications />
        <Avatar />
      </div>
    </div>
  )
}
