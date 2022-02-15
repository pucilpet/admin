import { RouteComponentProps } from "@reach/router"
import { navigate } from "gatsby"
import {
  useAdminCollection,
  useAdminDeleteCollection,
  useAdminUpdateCollection,
} from "medusa-react"
import React, { useEffect, useState } from "react"
import Spinner from "../../../components/atoms/spinner"
import EditIcon from "../../../components/fundamentals/icons/edit-icon"
import TrashIcon from "../../../components/fundamentals/icons/trash-icon"
import Actionables from "../../../components/molecules/actionables"
import Breadcrumb from "../../../components/molecules/breadcrumb"
import ViewRaw from "../../../components/molecules/view-raw"
import AddProductModal from "../../../components/organisms/add-product-modal"
import BodyCard from "../../../components/organisms/body-card"
import DeletePrompt from "../../../components/organisms/delete-prompt"
import { MetadataField } from "../../../components/organisms/metadata"
import CollectionModal from "../../../components/templates/collection-modal"
import ViewProductsTable from "../../../components/templates/collection-product-table/view-products-table"
import useToaster from "../../../hooks/use-toaster"
import Medusa from "../../../services/api"

const CollectionDetails: React.FC<RouteComponentProps> = ({ location }) => {
  const ensuredPath = location!.pathname.replace("/a/collections/", ``)
  const { collection, isLoading, refetch } = useAdminCollection(ensuredPath)
  const deleteCollection = useAdminDeleteCollection(ensuredPath)
  const updateCollection = useAdminUpdateCollection(ensuredPath)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showAddProducts, setShowAddProducts] = useState(false)
  const toaster = useToaster()
  const [updates, setUpdates] = useState(0)

  const handleDelete = () => {
    deleteCollection.mutate(undefined, {
      onSuccess: () => navigate(`/a/collections`),
    })
  }

  const handleUpdateDetails = (data: any, metadata: MetadataField[]) => {
    const payload: {
      title: string
      handle?: string
      metadata?: object
    } = {
      title: data.title,
      handle: data.handle,
    }

    if (metadata.length > 0) {
      const payloadMetadata = metadata
        .filter((m) => m.key && m.value) // remove empty metadata
        .reduce((acc, next) => {
          return {
            ...acc,
            [next.key]: next.value,
          }
        }, {})

      payload.metadata = payloadMetadata // deleting metadata will not work as it's not supported by the core
    }

    updateCollection.mutate(payload, {
      onSuccess: () => {
        setShowEdit(false)
        refetch()
      },
    })
  }

  const handleAddProducts = async (
    addedIds: string[],
    removedIds: string[]
  ) => {
    try {
      if (addedIds.length > 0) {
        await Medusa.collections.addProducts(collection?.id, {
          product_ids: addedIds,
        })
      }

      if (removedIds.length > 0) {
        await Medusa.collections.removeProducts(collection?.id, {
          product_ids: removedIds,
        })
      }

      refetch()
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (collection?.products?.length) {
      setUpdates(updates + 1) // force re-render product table when products are added/removed
    }
  }, [collection?.products])

  return (
    <>
      <div className="flex flex-col h-full">
        <Breadcrumb
          currentPage="Edit Collection"
          previousBreadcrumb="Collections"
          previousRoute="/a/collections"
        />
        <div className="rounded-rounded py-large px-xlarge border border-grey-20 bg-grey-0 mb-large">
          {isLoading || !collection ? (
            <div className="flex items-center w-full h-12">
              <Spinner variant="secondary" size="large" />
            </div>
          ) : (
            <div>
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="inter-xlarge-semibold mb-2xsmall">
                    {collection.title}
                  </h2>
                  <Actionables
                    forceDropdown
                    actions={[
                      {
                        label: "Edit Collection",
                        onClick: () => setShowEdit(true),
                        icon: <EditIcon size="20" />,
                      },
                      {
                        label: "Delete",
                        onClick: () => setShowDelete(!showDelete),
                        variant: "danger",
                        icon: <TrashIcon size="20" />,
                      },
                    ]}
                  />
                </div>
                <p className="inter-small-regular text-grey-50">
                  /{collection.handle}
                </p>
              </div>
              {collection.metadata && (
                <div className="mt-large flex flex-col gap-y-base">
                  <h3 className="inter-base-semibold">Metadata</h3>
                  <div>
                    <ViewRaw raw={collection.metadata} name="metadata" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <BodyCard
          title="Products"
          subtitle="To start selling, all you need is a name, price, and image."
          className="h-full"
          actionables={[
            {
              label: "Edit Products",
              icon: <EditIcon size="20" />,
              onClick: () => setShowAddProducts(!showAddProducts),
            },
          ]}
        >
          <div className="mt-large h-full">
            {isLoading || !collection ? (
              <div className="flex items-center w-full h-12">
                <Spinner variant="secondary" size="large" />
              </div>
            ) : (
              <ViewProductsTable
                key={updates} // force re-render when collection is updated
                collectionId={collection.id}
                refetchCollection={refetch}
              />
            )}
          </div>
        </BodyCard>
      </div>
      {showEdit && (
        <CollectionModal
          onClose={() => setShowEdit(!showEdit)}
          onSubmit={handleUpdateDetails}
          isEdit
          collection={collection}
        />
      )}
      {showDelete && (
        <DeletePrompt
          handleClose={() => setShowDelete(!showDelete)}
          heading="Delete collection"
          successText="Successfully deleted collection"
          onDelete={async () => handleDelete()}
          confirmText="Yes, delete"
        />
      )}
      {showAddProducts && (
        <AddProductModal
          handleClose={() => setShowAddProducts(false)}
          onSubmit={handleAddProducts}
          collectionProducts={collection?.products ?? []}
        />
      )}
    </>
  )
}

export default CollectionDetails
