import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { betterAuthPluginInstance } from '@/payload/plugins/better-auth'
import s3Plugin from '@/payload/plugins/s3'
import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '../../utilities/getURL'
import { plugin as searchPlugin } from './search/plugin'
import { plugin as formBuilderPlugin } from './formBuilder/plugin'
import { plugin as importExportPlugin } from './importExport/plugin'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin,
  searchPlugin,
  payloadCloudPlugin(),
  importExportPlugin,
  s3Plugin,
  betterAuthPluginInstance,
]
