import ctxMenu from 'e/modules/surface/ContextMenu';
import ctrlButtons from 'e/modules/surface/ControlButtons';
import appMenu from 'e/modules/surface/ApplicationMenu';
import dialog from 'e/modules/surface/AppDialogs';
import fWidget from 'e/windows/findwidget';
import cProvider from 'e/modules/service/ContentProvider';
import sIndex from 'e/modules/service/SearchIndex';
import locales from 'e/modules/service/Locales';
import repo from 'e/modules/service/RepoManager';

repo.start();
dialog.start();
locales.start();
ctxMenu.start();
ctrlButtons.start();
appMenu.start();
cProvider.start();
sIndex.start();
fWidget.start();
